import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, Subject, switchMap } from 'rxjs';
import type { Quotation, QuotationPage, QuotationView } from '@core/models/quotation/quotation';
import { QuotationService } from './quotation.service';

type Request = { kind: 'list'; view: QuotationView; page: number } | { kind: 'detail'; id: string };
interface QuotationState {
  list: QuotationPage | null;
  selected: Quotation | null;
  loading: boolean;
  error: boolean;
}
const emptyState = (): QuotationState => ({
  list: null,
  selected: null,
  loading: false,
  error: false,
});

/** Each route owns an instance so private requests are released when it closes. */
@Injectable()
export class QuotationStore {
  private readonly api = inject(QuotationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new Subject<Request | null>();
  private readonly state = signal(emptyState());
  private latest: Request | null = null;
  readonly list = computed(() => this.state().list);
  readonly selected = computed(() => this.state().selected);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.requests
      .pipe(
        switchMap((request) => {
          if (!request) return of(emptyState());
          this.state.set({ ...emptyState(), loading: true });
          const response =
            request.kind === 'list'
              ? this.api
                  .list(request.view, request.page)
                  .pipe(map((list): QuotationState => ({ ...emptyState(), list })))
              : this.api
                  .get(request.id)
                  .pipe(map((selected): QuotationState => ({ ...emptyState(), selected })));
          return response.pipe(catchError(() => of({ ...emptyState(), error: true })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.state.set(state));
  }

  loadList(view: QuotationView, page: number) {
    this.load({ kind: 'list', view, page });
  }
  loadOne(id: string) {
    this.load({ kind: 'detail', id });
  }
  retry() {
    if (this.latest && !this.loading()) this.load(this.latest);
  }
  updateSelected(selected: Quotation) {
    this.state.update((state) => ({ ...state, selected }));
  }
  clear(): void {
    this.latest = null;
    this.requests.next(null);
  }
  private load(request: Request) {
    this.latest = request;
    this.requests.next(request);
  }
}
