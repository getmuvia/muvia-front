import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { HTTP_ERROR_FEEDBACK } from '@core/models/errors/http-error-feedback';
import { UploadFileService } from './upload-file';

describe('UploadFileService', () => {
  let service: UploadFileService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UploadFileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deletes a draft upload without triggering global feedback', () => {
    const key = 'products/seller-id/chair.glb';

    service.deleteFile(key).subscribe();

    const request = httpTesting.expectOne(
      `${API_ENDPOINTS.FILES.BASE}/${encodeURIComponent(key)}`,
    );
    expect(request.request.method).toBe('DELETE');
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('none');
    request.flush(null);
  });

  it('posts a size-limited form and finalizes the stored object', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    let result: { key: string; url: string } | undefined;

    service.uploadFile(file, 'product_image').subscribe(value => {
      result = value;
    });

    const request = httpTesting.expectOne(API_ENDPOINTS.FILES.UPLOAD);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      purpose: 'product_image',
      contentType: 'image/png',
      fileSize: file.size,
    });
    request.flush({
      url: 'https://signed.example/upload',
      key: 'pending/product_image/me/photo.png',
      fields: { key: 'pending/product_image/me/photo.png', 'Content-Type': 'image/png' },
    });

    const upload = httpTesting.expectOne('https://signed.example/upload');
    expect(upload.request.method).toBe('POST');
    const form = upload.request.body as FormData;
    expect(form.get('key')).toBe('pending/product_image/me/photo.png');
    expect(form.get('Content-Type')).toBe('image/png');
    expect((form.get('file') as File).name).toBe(file.name);
    expect((form.get('file') as File).size).toBe(file.size);
    upload.flush('', { status: 204, statusText: 'No Content' });

    const finalize = httpTesting.expectOne(`${API_ENDPOINTS.FILES.BASE}/finalize`);
    expect(finalize.request.method).toBe('POST');
    expect(finalize.request.body).toEqual({ key: 'pending/product_image/me/photo.png' });
    finalize.flush({
      key: 'products/me/photo.png',
      url: 'https://storage.googleapis.com/assets/products/me/photo.png',
    });

    expect(result).toEqual({
      key: 'products/me/photo.png',
      url: 'https://storage.googleapis.com/assets/products/me/photo.png',
    });
  });

  it('does not finalize when Cloud Storage rejects the file', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    let failed = false;
    service.uploadFile(file, 'product_image').subscribe({
      error: () => { failed = true; },
    });

    httpTesting.expectOne(API_ENDPOINTS.FILES.UPLOAD).flush({
      url: 'https://signed.example/upload',
      key: 'pending/product_image/me/photo.png',
      fields: { key: 'pending/product_image/me/photo.png' },
    });
    httpTesting.expectOne('https://signed.example/upload').flush(
      'File too large',
      { status: 400, statusText: 'Bad Request' },
    );

    expect(failed).toBe(true);
    httpTesting.expectNone(`${API_ENDPOINTS.FILES.BASE}/finalize`);
  });
});
