import { DOCUMENT } from '@angular/common';
import { Injectable, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import es from './dictionaries/es';
import en from './dictionaries/en';

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof es;
export type TranslationParams = Readonly<Record<string, string | number>>;

const LANGUAGE_STORAGE_KEY = 'muvia.language';
const dictionaries: Record<Language, Record<TranslationKey, string>> = { es, en };
const sourceKeys = new Map<string, TranslationKey>(
  Object.entries(es).flatMap(([key, value]) => [
    [value, key as TranslationKey] as const,
    [en[key as TranslationKey], key as TranslationKey] as const,
  ]),
);
// Older catalog summaries expose only the controlled category label, without its code.
const categoryLabelKeys = new Map<string, TranslationKey>();
for (const key of Object.keys(es).filter(key => key.startsWith('categories.')) as TranslationKey[]) {
  categoryLabelKeys.set(es[key].trim().toLowerCase(), key);
  categoryLabelKeys.set(en[key].trim().toLowerCase(), key);
}
const parameterizedSources = Object.entries(es).filter(([, value]) => value.includes('{'))
  .map(([key, value]) => {
    const names: string[] = [];
    const escaped = value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\{(\w+)\}/g, (_, name: string) => {
      names.push(name);
      return '(.+?)';
    });
    return { key: key as TranslationKey, names, pattern: new RegExp(`^${pattern}$`) };
  });

/** Owns interface copy only. Seller content never passes through this service. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly selectedLanguage = signal<Language>('es');
  readonly language = this.selectedLanguage.asReadonly();
  private readonly countryNames = computed(() => new Intl.DisplayNames(
    [this.language()], { type: 'region' },
  ));

  constructor() {
    // Keep the first client render consistent with prerendered Spanish HTML.
    afterNextRender(() => {
      try {
        const saved = this.document.defaultView?.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'es' || saved === 'en') this.selectedLanguage.set(saved);
      } catch {
        // Storage can be unavailable in private or restricted browser contexts.
      }
    });
    effect(() => {
      this.document.documentElement.lang = this.language();
      this.document.title = this.t('app.title');
      this.document.querySelector('meta[name="description"]')?.setAttribute(
        'content', this.t('app.description'),
      );
    });
  }

  selectLanguage(language: Language): void {
    if (language !== 'es' && language !== 'en') return;
    this.selectedLanguage.set(language);
    try {
      this.document.defaultView?.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Changing the language still works when persistence is unavailable.
    }
  }

  t(key: TranslationKey, params: TranslationParams = {}): string {
    const message = dictionaries[this.language()][key] ?? es[key] ?? key;
    if (!message.includes('{')) return message;
    return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      Object.hasOwn(params, name) ? String(params[name]) : placeholder,
    );
  }

  /** Presents existing reviewed validation/error messages without changing state contracts. */
  text(message: string | null | undefined): string {
    if (!message) return '';
    const key = sourceKeys.get(message);
    if (key) return this.t(key);
    for (const source of parameterizedSources) {
      const match = message.match(source.pattern);
      if (match) return this.t(source.key, Object.fromEntries(
        source.names.map((name, index) => [name, match[index + 1]]),
      ));
    }
    return message;
  }

  categoryName(category: { code?: string; name: string } | null | undefined): string {
    if (!category) return this.t('catalog.uncategorized');
    const key = `categories.${category.code}`;
    if (Object.hasOwn(es, key)) return this.t(key as TranslationKey);
    const labelKey = !category.code ? categoryLabelKeys.get(category.name.trim().toLowerCase()) : undefined;
    return labelKey ? this.t(labelKey) : category.name;
  }

  label(key: string, fallback: string): string {
    return Object.hasOwn(es, key) ? this.t(key as TranslationKey) : fallback;
  }

  countryName(market: { code: string; name: string }): string {
    try {
      return this.countryNames().of(market.code) ?? market.name;
    } catch {
      return market.name;
    }
  }
}
