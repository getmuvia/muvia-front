import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, TranslationKey, TranslationParams } from './i18n';

// Impure pipes also refresh when the selected language changes but the input does not.
@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}

@Pipe({ name: 'uiText', pure: false })
export class UiTextPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(message: string | null | undefined): string {
    return this.i18n.text(message);
  }
}

@Pipe({ name: 'categoryName', pure: false })
export class CategoryNamePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(category: { code?: string; name: string } | null | undefined): string {
    return this.i18n.categoryName(category);
  }
}

@Pipe({ name: 'countryName', pure: false })
export class CountryNamePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(market: { code: string; name: string }): string {
    return this.i18n.countryName(market);
  }
}
