import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { HTTP_ERROR_FEEDBACK } from '@core/models/errors/http-error-feedback';
import { LoggerService } from '@core/services/logger/logger';
import { UserService } from './user';

describe('UserService vendor profile state', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LoggerService, useValue: { error: vi.fn() } },
      ],
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('delegates update failure feedback to the profile screen', () => {
    service
      .updateProfile({
        vendorProfile: { businessName: 'Muvia Decor' },
      })
      .subscribe();

    const request = httpTesting.expectOne(API_ENDPOINTS.USERS.ME);
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('local');
    request.flush({ vendorProfile: { businessName: 'Muvia Decor' } });
  });

  it('leaves the loading state and exposes a retryable message after failure', () => {
    service.loadVendorProfile('seller-id');
    expect(service.isVendorProfileLoading()).toBe(true);

    httpTesting
      .expectOne(`${API_ENDPOINTS.USERS.VENDOR}/seller-id`)
      .flush(
        { message: 'Internal profile repository error' },
        { status: 503, statusText: 'Service Unavailable' },
      );

    expect(service.isVendorProfileLoading()).toBe(false);
    expect(service.vendorProfileError()).toBe('No pudimos cargar la información de tu negocio.');
  });
});
