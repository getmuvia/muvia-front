import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { CreateProductAsset } from '@core/models/product/create-product.dto';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { LoggerService } from '@core/services/logger/logger';
import { UploadFileService, UploadResponse } from '@core/services/uploadFile/upload-file';
import {
    DraftFileUploadError,
    DraftSubmissionCancelledError,
    ProductDraftAssets,
    ProductDraftFiles,
} from './product-draft-files';

describe('ProductDraftFiles', () => {
    let draft: ProductDraftFiles;
    let uploadFile: ReturnType<typeof vi.fn>;
    let deleteFile: ReturnType<typeof vi.fn>;
    let compressImage: ReturnType<typeof vi.fn>;
    let logger: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
    const uploaded: UploadResponse = { key: 'products/seller/image.webp', url: 'https://storage.example/image.webp' };
    const localFile = new File(['image'], 'image.webp', { type: 'image/webp' });

    beforeEach(() => {
        uploadFile = vi.fn().mockReturnValue(of(uploaded));
        deleteFile = vi.fn().mockReturnValue(of(undefined));
        compressImage = vi.fn((file: File) => Promise.resolve(file));
        logger = { error: vi.fn(), warn: vi.fn() };
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        TestBed.configureTestingModule({
            providers: [
                ProductDraftFiles,
                { provide: UploadFileService, useValue: { uploadFile, deleteFile } },
                { provide: ImageOptimizerService, useValue: { compressImage } },
                { provide: LoggerService, useValue: logger },
            ],
        });
        draft = TestBed.inject(ProductDraftFiles);
    });

    it('preserves existing remote assets without uploading or deleting them', async () => {
        const assets = images('https://storage.example/existing.webp');
        const persist = vi.fn().mockResolvedValue('saved');

        await expect(draft.save(assets, persist)).resolves.toBe('saved');
        draft.reset();

        expect(persist).toHaveBeenCalledWith(assets);
        expect(uploadFile).not.toHaveBeenCalled();
        expect(deleteFile).not.toHaveBeenCalled();
    });

    it('resolves images and both model formats using their upload purposes', async () => {
        const assets: ProductDraftAssets = {
            images: images('blob:image').images,
            glb: model('blob:glb', 'glb'),
            usdz: model('blob:usdz', 'usdz'),
        };
        const glb = new File(['glb'], 'model.glb', { type: 'model/gltf-binary' });
        const usdz = new File(['usdz'], 'model.usdz', { type: 'model/vnd.usdz+zip' });
        draft.register({ url: 'blob:image', file: localFile });
        draft.register({ url: 'blob:glb', file: glb });
        draft.register({ url: 'blob:usdz', file: usdz });
        uploadFile.mockImplementation((file: File) => of({ key: file.name, url: `https://storage.example/${file.name}` }));
        const persist = vi.fn().mockResolvedValue(undefined);

        await draft.save(assets, persist);
        draft.reset();

        expect(uploadFile.mock.calls.map(call => [call[0], call[1], call[2]])).toEqual([
            [localFile, 'product_image', 'local'],
            [glb, 'product_model', 'local'],
            [usdz, 'product_model', 'local'],
        ]);
        expect(persist).toHaveBeenCalledWith({
            images: [{ ...assets.images[0], url: 'https://storage.example/image.webp' }],
            glb: { ...assets.glb, url: 'https://storage.example/model.glb' },
            usdz: { ...assets.usdz, url: 'https://storage.example/model.usdz' },
        });
        expect(draft.pendingCount()).toBe(0);
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
        expect(deleteFile).not.toHaveBeenCalled();
    });

    it('rolls back an earlier upload when a later file fails and keeps local files for retry', async () => {
        const failure = new Error('Storage unavailable');
        const second = new File(['image'], 'second.webp', { type: 'image/webp' });
        draft.register({ url: 'blob:first', file: localFile });
        draft.register({ url: 'blob:second', file: second });
        const assets = images('blob:first', 'blob:second');
        uploadFile.mockReturnValueOnce(of(uploaded)).mockReturnValueOnce(throwError(() => failure));
        const persist = vi.fn().mockResolvedValue(undefined);

        await expect(draft.save(assets, persist)).rejects.toMatchObject({
            fileName: 'second.webp', cause: failure,
        });

        expect(persist).not.toHaveBeenCalled();
        expect(deleteFile).toHaveBeenCalledWith(uploaded.key);
        expect(draft.pendingCount()).toBe(2);
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
        await draft.save(assets, persist);
        expect(uploadFile).toHaveBeenCalledTimes(4);
        expect(draft.pendingCount()).toBe(0);
    });

    it('uses the original image if compression fails', async () => {
        compressImage.mockRejectedValue(new Error('Worker failed'));
        draft.register({ url: 'blob:image', file: localFile });

        await draft.save(images('blob:image'), vi.fn().mockResolvedValue(undefined));

        expect(uploadFile).toHaveBeenCalledWith(localFile, 'product_image', 'local');
        expect(logger.warn).toHaveBeenCalledOnce();
    });

    it('invalidates pending compression on reset without uploading files from the old product', async () => {
        const compression = deferred<File>();
        compressImage.mockReturnValue(compression.promise);
        draft.register({ url: 'blob:old', file: localFile });
        const persist = vi.fn();
        const submission = draft.save(images('blob:old'), persist);
        const cancelled = expect(submission).rejects.toBeInstanceOf(DraftSubmissionCancelledError);

        draft.reset();
        compressImage.mockResolvedValue(localFile);
        draft.register({ url: 'blob:new', file: localFile });
        compression.resolve(localFile);
        await cancelled;

        expect(uploadFile).not.toHaveBeenCalled();
        expect(persist).not.toHaveBeenCalled();
        expect(draft.pendingCount()).toBe(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old');
        expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:new');
    });

    it('cleans a late upload after reset without changing the new product session', async () => {
        const upload = new Subject<UploadResponse>();
        uploadFile.mockReturnValue(upload);
        draft.register({ url: 'blob:old', file: localFile });
        const persist = vi.fn();
        const submission = draft.save(images('blob:old'), persist);
        const cancelled = expect(submission).rejects.toBeInstanceOf(DraftSubmissionCancelledError);
        await vi.waitFor(() => expect(uploadFile).toHaveBeenCalledOnce());

        draft.reset();
        draft.register({ url: 'blob:new', file: localFile });
        upload.next(uploaded);
        upload.complete();
        await cancelled;

        expect(deleteFile).toHaveBeenCalledOnce();
        expect(deleteFile).toHaveBeenCalledWith(uploaded.key);
        expect(persist).not.toHaveBeenCalled();
        expect(draft.pendingCount()).toBe(1);
    });

    it('waits for persistence before cleaning uploads from a discarded session', async () => {
        const persistence = deferred<void>();
        draft.register({ url: 'blob:old', file: localFile });
        const persist = vi.fn().mockReturnValue(persistence.promise);
        const submission = draft.save(images('blob:old'), persist);
        const failed = expect(submission).rejects.toThrow('Save failed');
        await vi.waitFor(() => expect(persist).toHaveBeenCalledOnce());

        draft.reset();
        draft.register({ url: 'blob:new', file: localFile });
        expect(deleteFile).not.toHaveBeenCalled();
        persistence.reject(new Error('Save failed'));
        await failed;

        expect(deleteFile).toHaveBeenCalledWith(uploaded.key);
        expect(draft.pendingCount()).toBe(1);
    });

    it('cleans a late upload when the editor is destroyed', async () => {
        const upload = new Subject<UploadResponse>();
        uploadFile.mockReturnValue(upload);
        draft.register({ url: 'blob:destroyed', file: localFile });
        const persist = vi.fn();
        const submission = draft.save(images('blob:destroyed'), persist);
        const cancelled = expect(submission).rejects.toBeInstanceOf(DraftSubmissionCancelledError);
        await vi.waitFor(() => expect(uploadFile).toHaveBeenCalledOnce());

        TestBed.resetTestingModule();
        upload.next(uploaded);
        upload.complete();
        await cancelled;

        expect(persist).not.toHaveBeenCalled();
        expect(deleteFile).toHaveBeenCalledWith(uploaded.key);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:destroyed');
    });

    it('preserves the upload error when rollback deletion fails and retries with the retained upload', async () => {
        const saveError = new Error('Save failed');
        deleteFile.mockReturnValue(throwError(() => new Error('Deletion failed')));
        draft.register({ url: 'blob:image', file: localFile });

        await expect(draft.save(images('blob:image'), vi.fn().mockRejectedValue(saveError))).rejects.toBe(saveError);
        expect(logger.error).toHaveBeenCalledOnce();
        await draft.save(images('blob:image'), vi.fn().mockResolvedValue(undefined));

        expect(uploadFile).toHaveBeenCalledOnce();
        expect(draft.pendingCount()).toBe(0);
    });

    it('does not upload an image removed while it is being prepared', async () => {
        const compression = deferred<File>();
        compressImage.mockReturnValue(compression.promise);
        draft.register({ url: 'blob:removed', file: localFile });
        const persist = vi.fn();
        const submission = draft.save(images('blob:removed'), persist);
        const cancelled = expect(submission).rejects.toBeInstanceOf(DraftSubmissionCancelledError);

        draft.retain(new Set());
        compression.resolve(localFile);
        await cancelled;

        expect(uploadFile).not.toHaveBeenCalled();
        expect(persist).not.toHaveBeenCalled();
        expect(draft.pendingCount()).toBe(0);
    });

    it('identifies the file and original cause when an upload fails', async () => {
        const cause = new Error('Upload failed');
        uploadFile.mockReturnValue(throwError(() => cause));
        draft.register({ url: 'blob:image', file: localFile });

        await expect(draft.save(images('blob:image'), vi.fn())).rejects.toBeInstanceOf(DraftFileUploadError);
        expect(deleteFile).not.toHaveBeenCalled();
    });
});

function images(...urls: string[]): ProductDraftAssets {
    return {
        images: urls.map((url, index) => ({ url, type: 'image', isPrimary: index === 0, metadata: { alt: 'Product' } })),
        glb: null,
        usdz: null,
    };
}

function model(url: string, format: 'glb' | 'usdz'): CreateProductAsset {
    return { url, type: 'model_3d', isPrimary: false, metadata: { format } };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}
