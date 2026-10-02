import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CreateProductAsset } from '@core/models/product/create-product.dto';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { LoggerService } from '@core/services/logger/logger';
import { UploadFileService, UploadResponse } from '@core/services/uploadFile/upload-file';

export interface ProductDraftAssets {
    images: CreateProductAsset[];
    glb: CreateProductAsset | null;
    usdz: CreateProductAsset | null;
}

export class DraftFileUploadError extends Error {
    constructor(readonly fileName: string, cause: unknown) {
        super(`Failed to upload ${fileName}`, { cause });
    }
}

export class DraftSubmissionCancelledError extends Error {}

interface DraftFile {
    url: string;
    prepared: Promise<File>;
    upload: UploadResponse | null;
    inUse: boolean;
    removed: boolean;
    revoked: boolean;
    cleanup?: Promise<void>;
}

interface DraftSession {
    files: Map<string, DraftFile>;
    saving: boolean;
}

/** Owns local previews and unattached uploads for one product editor. */
@Injectable()
export class ProductDraftFiles {
    private readonly uploads = inject(UploadFileService);
    private readonly optimizer = inject(ImageOptimizerService);
    private readonly logger = inject(LoggerService);
    private readonly pendingCountState = signal(0);
    private session: DraftSession = { files: new Map(), saving: false };
    private destroyed = false;

    readonly pendingCount = this.pendingCountState.asReadonly();

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destroyed = true;
            this.reset();
        });
    }

    register({ url, file }: { url: string; file: File }): void {
        if (this.destroyed) return;

        this.remove(url);
        this.session.files.set(url, {
            url,
            prepared: file.type.startsWith('image/') ? this.prepareImage(file) : Promise.resolve(file),
            upload: null,
            inUse: false,
            removed: false,
            revoked: false,
        });
        this.updatePendingCount();
    }

    retain(urls: ReadonlySet<string>): void {
        for (const url of this.session.files.keys()) {
            if (!urls.has(url)) this.remove(url);
        }
    }

    remove(url: string): void {
        const file = this.session.files.get(url);
        if (!file) return;

        this.session.files.delete(url);
        this.retire(file);
        this.updatePendingCount();
    }

    reset(): void {
        const previous = this.session;
        this.session = { files: new Map(), saving: false };
        this.updatePendingCount();
        for (const file of previous.files.values()) this.retire(file);
    }

    /** Keeps local files on failure and releases remote uploads only after persistence settles. */
    async save<T>(assets: ProductDraftAssets, persist: (resolved: ProductDraftAssets) => Promise<T>): Promise<T> {
        const session = this.session;
        this.assertCurrent(session);
        if (session.saving) throw new Error('A product draft submission is already in progress');

        const selectedAssets = [...assets.images, assets.glb, assets.usdz].filter(
            (asset): asset is CreateProductAsset => asset !== null,
        );
        const files = selectedAssets.flatMap(asset => {
            const file = session.files.get(asset.url);
            return file ? [file] : [];
        });
        session.saving = true;
        for (const file of files) file.inUse = true;

        try {
            await Promise.all(files.map(file => file.prepared));
            this.assertCurrent(session);

            const images: CreateProductAsset[] = [];
            for (const asset of assets.images) images.push(await this.resolveAsset(session, asset));
            const resolved: ProductDraftAssets = {
                images,
                glb: assets.glb ? await this.resolveAsset(session, assets.glb) : null,
                usdz: assets.usdz ? await this.resolveAsset(session, assets.usdz) : null,
            };
            this.assertCurrent(session);
            const result = await persist(resolved);

            // A successful save owns these files, even if the editor changed during the request.
            for (const file of files) {
                file.upload = null;
                session.files.delete(file.url);
                this.revokePreview(file);
            }
            if (session === this.session) this.updatePendingCount();
            this.assertCurrent(session);
            return result;
        } catch (error) {
            await Promise.all(files.map(file => this.cleanupUpload(file)));
            throw error;
        } finally {
            session.saving = false;
            for (const file of files) file.inUse = false;
        }
    }

    private async prepareImage(file: File): Promise<File> {
        try {
            return await this.optimizer.compressImage(file);
        } catch (error) {
            this.logger.warn('Image optimization failed; using the original file', error, 'ProductDraftFiles');
            return file;
        }
    }

    private async resolveAsset(session: DraftSession, asset: CreateProductAsset): Promise<CreateProductAsset> {
        this.assertCurrent(session);
        const draft = session.files.get(asset.url);
        if (!draft) {
            if (asset.url.startsWith('blob:')) throw new DraftSubmissionCancelledError();
            return asset;
        }
        if (draft.removed) throw new DraftSubmissionCancelledError();

        const file = await draft.prepared;
        this.assertCurrent(session);
        if (!draft.upload) {
            try {
                draft.upload = await firstValueFrom(this.uploads.uploadFile(
                    file,
                    asset.type === 'model_3d' ? 'product_model' : 'product_image',
                    'local',
                ));
            } catch (error) {
                throw new DraftFileUploadError(file.name, error);
            }
        }
        this.assertCurrent(session);
        if (draft.removed) throw new DraftSubmissionCancelledError();
        return { ...asset, url: draft.upload.url };
    }

    private assertCurrent(session: DraftSession): void {
        if (this.destroyed || session !== this.session) throw new DraftSubmissionCancelledError();
    }

    private retire(file: DraftFile): void {
        file.removed = true;
        this.revokePreview(file);
        if (!file.inUse) void this.cleanupUpload(file);
    }

    private revokePreview(file: DraftFile): void {
        if (!file.revoked && file.url.startsWith('blob:')) URL.revokeObjectURL(file.url);
        file.revoked = true;
    }

    private cleanupUpload(file: DraftFile): Promise<void> {
        if (file.cleanup) return file.cleanup;
        const upload = file.upload;
        if (!upload) return Promise.resolve();

        file.cleanup = firstValueFrom(this.uploads.deleteFile(upload.key))
            .then(() => { file.upload = null; })
            .catch(error => this.logger.error('Failed to clean up draft upload', error, 'ProductDraftFiles'))
            .finally(() => { file.cleanup = undefined; });
        return file.cleanup;
    }

    private updatePendingCount(): void {
        this.pendingCountState.set(this.session.files.size);
    }
}
