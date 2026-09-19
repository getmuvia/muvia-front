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
});
