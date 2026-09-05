import { Component, input, output, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, map, of, switchMap, timer } from 'rxjs';

@Component({
    selector: 'app-filter-bar',
    imports: [],
    templateUrl: './filter-bar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './filter-bar.css',
})
export class FilterBar {
    readonly searchChange = output<string>();
    /** Input for the current active search query to display as a chip */
    readonly activeSearch = input<string>('');
    /** Emitted when the user clears the search chip */
    readonly clearSearch = output<void>();

    readonly searchQuery = linkedSignal(() => this.activeSearch());
    private readonly searchRequests = new Subject<{ query: string; immediate: boolean } | null>();

    constructor() {
        this.searchRequests.pipe(
            switchMap(request => request === null
                ? EMPTY
                : request.immediate
                    ? of(request.query)
                    : timer(700).pipe(map(() => request.query))
            ),
            takeUntilDestroyed()
        ).subscribe(query => {
            const normalizedQuery = query.trim();
            if (normalizedQuery !== this.activeSearch()) {
                this.searchChange.emit(normalizedQuery);
            }
        });
    }

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);

        this.searchRequests.next({ query: input.value, immediate: false });
    }

    onSearchSubmit(event: Event): void {
        event.preventDefault();
        this.searchRequests.next({ query: this.searchQuery(), immediate: true });
    }

    onClearSearch(): void {
        this.searchRequests.next(null);
        this.searchQuery.set('');
        this.clearSearch.emit();
    }
}
