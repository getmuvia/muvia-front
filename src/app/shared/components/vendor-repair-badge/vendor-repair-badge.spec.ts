import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@core/services/i18n/i18n';
import { VendorRepairBadge } from './vendor-repair-badge';

describe('VendorRepairBadge', () => {
    let fixture: ComponentFixture<VendorRepairBadge>;
    const profile = {
        offersRepairs: true, repairScope: 'Tapizado',
        repairDetails: 'Evaluación antes de cotizar', repairsExternalProducts: true,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [VendorRepairBadge] });
        TestBed.inject(I18nService).selectLanguage('es');
        fixture = TestBed.createComponent(VendorRepairBadge);
    });

    afterEach(() => localStorage.removeItem('muvia.language'));

    it('hides the badge for existing or disabled profiles', () => {
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[data-repair-badge]')).toBeNull();
        fixture.componentRef.setInput('profile', { ...profile, offersRepairs: false });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[data-repair-badge]')).toBeNull();
    });

    it('shows scope and expands service details', () => {
        fixture.componentRef.setInput('profile', profile);
        fixture.detectChanges();
        const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
        expect(details.open).toBe(false);
        expect(details.textContent).toContain('Tapizado');
        (details.querySelector('summary') as HTMLElement).click();
        expect(details.open).toBe(true);
        expect(details.textContent).toContain('Evaluación antes de cotizar');
        expect(details.textContent).toContain('comprados en otros comercios');
    });

    it('translates interface labels while preserving seller-provided text', () => {
        fixture.componentRef.setInput('profile', { ...profile, repairsExternalProducts: false });
        fixture.detectChanges();
        TestBed.inject(I18nService).selectLanguage('en');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Offers repairs');
        expect(fixture.nativeElement.textContent).toContain('purchased from this store');
        expect(fixture.nativeElement.textContent).toContain('Tapizado');
    });

    it('renders the declared scope as text rather than HTML', () => {
        fixture.componentRef.setInput('profile', { ...profile, repairScope: '<img src=x onerror=alert(1)>' });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('img')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('<img src=x');
    });
});
