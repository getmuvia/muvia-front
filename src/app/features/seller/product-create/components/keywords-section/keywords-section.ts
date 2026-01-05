import { Component, Input, Output, EventEmitter, signal } from '@angular/core';

@Component({
    selector: 'app-keywords-section',
    imports: [],
    templateUrl: './keywords-section.html',
    styleUrl: './keywords-section.css',
})
export class KeywordsSection {
    @Input() keywords: string[] = [];
    @Output() keywordsChange = new EventEmitter<string[]>();

    newKeyword = signal('');

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addKeyword();
        }
    }

    addKeyword(): void {
        const keyword = this.newKeyword().trim().toLowerCase();
        if (keyword && !this.keywords.includes(keyword)) {
            const updated = [...this.keywords, keyword];
            this.keywordsChange.emit(updated);
            this.newKeyword.set('');
        }
    }

    removeKeyword(keyword: string): void {
        const updated = this.keywords.filter(k => k !== keyword);
        this.keywordsChange.emit(updated);
    }

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.newKeyword.set(input.value);
    }
}
