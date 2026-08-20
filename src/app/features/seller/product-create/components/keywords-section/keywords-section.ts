import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-keywords-section',
    imports: [],
    templateUrl: './keywords-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './keywords-section.css',
})
export class KeywordsSection {
    readonly keywords = input<string[]>([]);
    readonly keywordsChange = output<string[]>();

    newKeyword = signal('');

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addKeyword();
        }
    }

    addKeyword(): void {
        const keyword = this.newKeyword().trim().toLowerCase();
        if (keyword && !this.keywords().includes(keyword)) {
            this.keywordsChange.emit([...this.keywords(), keyword]);
            this.newKeyword.set('');
        }
    }

    removeKeyword(keyword: string): void {
        this.keywordsChange.emit(this.keywords().filter(k => k !== keyword));
    }

    onInputChange(event: Event): void {
        this.newKeyword.set((event.target as HTMLInputElement).value);
    }
}
