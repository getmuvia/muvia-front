import {
    Component,
    inject,
    signal,
    computed,
    output,
    effect,
    ElementRef,
    viewChild,
    HostListener,
    DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgOptimizedImage, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';

@Component({
    selector: 'app-smart-search-modal',
    imports: [NgOptimizedImage, CurrencyPipe],
    templateUrl: './smart-search-modal.html',
    styleUrl: './smart-search-modal.css',
})
export class SmartSearchModal {
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly searchService = inject(HybridSearchService);
    private readonly logger = inject(LoggerService);

    readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    /** Event emitted when modal should close */
    close = output<void>();

    /** Search state */
    query = signal('');
    results = signal<HybridSearchResult[]>([]);
    isLoading = signal(false);
    error = signal<string | null>(null);

    /** Keyboard navigation */
    selectedIndex = signal(-1);

    /** Computed states */
    hasResults = computed(() => this.results().length > 0);
    showEmptyState = computed(() =>
        this.query().length >= 2 && !this.isLoading() && !this.hasResults() && !this.error()
    );

    private searchTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        // Auto-focus input when modal opens
        effect(() => {
            const input = this.searchInput();
            if (input) {
                setTimeout(() => input.nativeElement.focus(), 50);
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Escape':
                this.onClose();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateResults(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateResults(-1);
                break;
            case 'Enter':
                if (this.selectedIndex() >= 0) {
                    this.selectResult(this.results()[this.selectedIndex()]);
                } else if (this.query().length >= 2) {
                    this.submitSearch();
                }
                break;
        }
    }

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.trim();
        this.query.set(value);
        this.selectedIndex.set(-1);

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Don't search if query is too short
        if (value.length < 2) {
            this.results.set([]);
            this.error.set(null);
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(value);
        }, 600);
    }

    performSearch(query: string): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.searchService.search(query, HYBRID_SEARCH_LIMITS.MODAL).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.results.set(response.results);
                this.isLoading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.logger.error('Hybrid search failed', err, 'SmartSearchModal');
                this.error.set('Error al buscar. Intenta de nuevo.');
                this.isLoading.set(false);
            }
        });
    }

    private navigateResults(direction: number): void {
        const total = this.results().length;
        if (total === 0) return;

        let newIndex = this.selectedIndex() + direction;
        if (newIndex < 0) newIndex = total - 1;
        if (newIndex >= total) newIndex = 0;

        this.selectedIndex.set(newIndex);
    }

    submitSearch(): void {
        this.router.navigate(['/products'], {
            queryParams: { search: this.query() }
        }).then(() => this.onClose());
    }

    selectResult(result: HybridSearchResult): void {
        this.router.navigate(['/products', result.id]).then(() => this.onClose());
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.onClose();
        }
    }

    onClose(): void {
        this.close.emit();
    }

    /** Get badge color based on match type */
    getMatchTypeBadge(type: string): string {
        switch (type) {
            case 'semantic': return 'bg-purple-100 text-purple-700';
            case 'hybrid': return 'bg-blue-100 text-blue-700';
            case 'lexical': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
