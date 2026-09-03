import { Component, input, output, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, map, of, switchMap, timer } from 'rxjs';

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
    private readonly searchRequests = new Subject<{ query: string; immediate: boolean }>();

    constructor() {
        this.searchRequests.pipe(
            switchMap(({ query, immediate }) => immediate
                ? of(query)
                : timer(700).pipe(map(() => query))
            ),
            takeUntilDestroyed()
        ).subscribe(query => this.searchChange.emit(query));
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
        this.searchQuery.set('');
        this.clearSearch.emit();
    }
}
