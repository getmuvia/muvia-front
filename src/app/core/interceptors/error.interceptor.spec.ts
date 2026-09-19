import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ToastService } from '@core/services/toast/toast';
import { createHttpErrorFeedbackContext, HttpErrorFeedback } from '@core/models/errors/http-error-feedback';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
    let http: HttpClient;
    let httpTesting: HttpTestingController;
    let toastError: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        toastError = vi.fn();

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                {
                    provide: ToastService,
                    useValue: { error: toastError },
                },
            ],
        });

        http = TestBed.inject(HttpClient);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTesting.verify();
    });

    it('shows the normalized Spanish message for global errors', () => {
        const url = '/api/products';

        http.get(url).subscribe({ error: () => undefined });
        httpTesting.expectOne(url).flush(
            { message: 'Database connection refused at internal-host:5432' },
            { status: 500, statusText: 'Internal Server Error' },
        );

        expect(toastError).toHaveBeenCalledWith(
            'El servicio no está disponible en este momento. Inténtalo nuevamente.',
        );
    });

    it.each<HttpErrorFeedback>(['local', 'none'])(
        'does not show a global toast when feedback ownership is %s',
        (feedback) => {
            const url = '/api/search';
            const context = createHttpErrorFeedbackContext(feedback);

            http.get(url, { context }).subscribe({ error: () => undefined });
            httpTesting.expectOne(url).flush(
                { message: 'Search provider unavailable' },
                { status: 503, statusText: 'Service Unavailable' },
            );

            expect(toastError).not.toHaveBeenCalled();
        },
    );
});
