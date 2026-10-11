import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { toAppError } from '@core/models/errors/api-error.model';
import { I18nService } from './i18n';
import es from './dictionaries/es';
import en from './dictionaries/en';

@Component({ template: '' })
class RenderHost {}

describe('I18nService', () => {
  beforeEach(() => localStorage.removeItem('muvia.language'));
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem('muvia.language');
  });

  it('keeps both dictionaries complete with matching interpolation parameters', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(en[key].trim(), key).not.toBe('');
      const parameters = (value: string) => [...value.matchAll(/\{(\w+)\}/g)]
        .map(match => match[1]).sort();
      expect(parameters(en[key]), key).toEqual(parameters(es[key]));
      if (key.endsWith('.one')) expect(Object.hasOwn(es, key.replace(/\.one$/, '.other'))).toBe(true);
    }
  });

  it('starts in Spanish and persists an explicit language choice', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.language()).toBe('es');
    i18n.selectLanguage('en');
    expect(i18n.language()).toBe('en');
    expect(localStorage.getItem('muvia.language')).toBe('en');
  });

  it('restores the saved choice after the initial render', async () => {
    localStorage.setItem('muvia.language', 'en');
    const i18n = TestBed.inject(I18nService);
    expect(i18n.language()).toBe('es');
    const fixture = TestBed.createComponent(RenderHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(i18n.language()).toBe('en');
  });

  it('ignores an unsupported saved language', async () => {
    localStorage.setItem('muvia.language', 'fr');
    const i18n = TestBed.inject(I18nService);
    const fixture = TestBed.createComponent(RenderHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(i18n.language()).toBe('es');
  });

  it('continues switching language when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    const i18n = TestBed.inject(I18nService);
    expect(() => i18n.selectLanguage('en')).not.toThrow();
    expect(i18n.t('common.language')).toBe('Language');
  });

  it('updates document language and metadata', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(en['app.title']);
    i18n.selectLanguage('es');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('es');
  });

  it('interpolates literal user values without treating them as keys or HTML', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    expect(i18n.t('catalog.noProductsForQuery', { query: '<script>{count}</script>' }))
      .toBe('We found no products for "<script>{count}</script>"');
  });

  it('translates retained file validation messages without changing file names', () => {
    const i18n = TestBed.inject(I18nService);
    const message = 'No agregamos “Mi mueble [1].png”: supera el límite de 5 MB. Reduce su tamaño e inténtalo nuevamente.';
    i18n.selectLanguage('en');
    expect(i18n.text(message)).toBe('We did not add “Mi mueble [1].png”: it exceeds the 5 MB limit. Reduce its size and try again.');
    i18n.selectLanguage('es');
    expect(i18n.text(message)).toBe(message);
  });

  it('presents reviewed messages saved in either supported language', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    expect(i18n.text('Debes iniciar sesión para continuar.')).toBe('You must sign in to continue.');
    i18n.selectLanguage('es');
    expect(i18n.text('You must sign in to continue.')).toBe('Debes iniciar sesión para continuar.');
  });

  it('localizes safe normalized errors while retaining their contract', () => {
    const error = toAppError(new HttpErrorResponse({
      status: 500, error: { message: 'database password leaked', code: 'INTERNAL_ERROR' },
    }));
    const snapshot = { ...error };
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    expect(i18n.text(error.message)).toBe('The service is currently unavailable. Try again.');
    expect(error).toEqual(snapshot);
  });

  it('translates controlled categories and country names with a fallback for unknown codes', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    expect(i18n.categoryName({ code: 'DESK', name: 'Escritorios' })).toBe('Desks');
    expect(i18n.categoryName({ name: 'Escritorios' })).toBe('Desks');
    expect(i18n.categoryName({ code: 'NEW_CODE', name: 'Nueva categoría' })).toBe('Nueva categoría');
    expect(i18n.countryName({ code: 'PE', name: 'Perú' })).toBe('Peru');
    expect(i18n.text('Texto libre del vendedor')).toBe('Texto libre del vendedor');
  });
});
