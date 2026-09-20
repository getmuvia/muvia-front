import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ErrorTelemetryService } from '@core/observability/error-telemetry';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import { CORRELATION_ID_HEADER } from '@core/observability/error-telemetry.model';
import { environment } from '@environments/environment';
import { correlationInterceptor } from './correlation.interceptor';

describe('correlationInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let captureHttpFailure: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    captureHttpFailure = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ErrorTelemetryService,
          useValue: { captureHttpFailure },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds a correlation ID to API requests and reports failures once', () => {
    const url = `${environment.apiUrl}/products/42?token=private`;
    http.get(url, {
      headers: { Authorization: 'Bearer active-token' },
    }).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(url);
    const correlationId = request.request.headers.get(CORRELATION_ID_HEADER);
    expect(correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    request.flush(
      { message: 'Internal failure' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    expect(captureHttpFailure).toHaveBeenCalledOnce();
    expect(captureHttpFailure).toHaveBeenCalledWith(
      expect.objectContaining({ status: 503 }),
      expect.objectContaining({ method: 'GET' }),
      correlationId,
    );
  });

  it('does not attach custom API headers to third-party signed uploads', () => {
    const url = 'https://storage.googleapis.com/bucket/file?signature=private';
    http.put(url, new Blob()).subscribe();

    const request = httpTesting.expectOne(url);
    expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(false);
    request.flush(null);
  });

  it('does not report a handled validation failure from an expected workflow', () => {
    const url = `${environment.apiUrl}/products`;
    http.post(url, {}, {
      context: createHttpErrorFeedbackContext('local', { expectedStatuses: [422] }),
    }).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(url);
    request.flush(
      { message: ['title must not be empty'] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(captureHttpFailure).not.toHaveBeenCalled();
  });

  it('still reports server failures from an expected workflow', () => {
    const url = `${environment.apiUrl}/products`;
    http.post(url, {}, {
      context: createHttpErrorFeedbackContext('local', { expectedStatuses: [422] }),
    }).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(url);
    const correlationId = request.request.headers.get(CORRELATION_ID_HEADER);
    request.flush(
      { message: 'Internal failure' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(captureHttpFailure).toHaveBeenCalledOnce();
    expect(captureHttpFailure).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      expect.anything(),
      correlationId,
    );
  });
});
