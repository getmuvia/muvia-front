import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileMetadataEditModal, ProfileMetadataFormData } from './profile-metadata-edit-modal';

describe('ProfileMetadataEditModal repair configuration', () => {
    let fixture: ComponentFixture<ProfileMetadataEditModal>;
    let component: ProfileMetadataEditModal;
    const initial: ProfileMetadataFormData = {
        businessName: 'Store', description: '', offersRepairs: false,
        repairScope: '', repairDetails: '', repairsExternalProducts: false,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [ProfileMetadataEditModal] });
        fixture = TestBed.createComponent(ProfileMetadataEditModal);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('initialData', initial);
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
    });

    it('starts disabled and requires a nonblank scope only when enabled', () => {
        expect(component.form.valid).toBe(true);
        expect(fixture.nativeElement.querySelector('#repair-scope')).toBeNull();
        component.form.controls.offersRepairs.setValue(true);
        component.repairScope.setValue('  ');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#repair-scope')).not.toBeNull();
        const save = vi.fn();
        component.save.subscribe(save);
        component.onSubmit();
        expect(save).not.toHaveBeenCalled();
        expect(component.repairScope.invalid).toBe(true);
    });

    it('restores saved repair settings and retains them when editing the name', () => {
        fixture.componentRef.setInput('initialData', {
            ...initial, offersRepairs: true, repairScope: ' Tapizado ',
            repairDetails: ' Cotización previa ', repairsExternalProducts: true,
        });
        fixture.detectChanges();
        component.form.controls.businessName.setValue('Updated store');
        const save = vi.fn();
        component.save.subscribe(save);
        component.onSubmit();
        expect(save).toHaveBeenCalledWith({
            businessName: 'Updated store', description: '', offersRepairs: true,
            repairScope: 'Tapizado', repairDetails: 'Cotización previa', repairsExternalProducts: true,
        });
    });

    it('clears repair settings in the save payload when disabled', () => {
        component.form.patchValue({ repairScope: 'Tapizado', repairDetails: 'Details', repairsExternalProducts: true });
        const save = vi.fn();
        component.save.subscribe(save);
        component.onSubmit();
        expect(save).toHaveBeenCalledWith(initial);
    });

    it('rejects oversized service text before saving', () => {
        component.form.patchValue({ offersRepairs: true, repairScope: 'x'.repeat(161), repairDetails: 'x'.repeat(501) });
        const save = vi.fn();
        component.save.subscribe(save);
        component.onSubmit();
        expect(save).not.toHaveBeenCalled();
        expect(component.repairScope.hasError('maxlength')).toBe(true);
        expect(component.form.controls.repairDetails.hasError('maxlength')).toBe(true);
    });

    it('does not save while a request is in progress', () => {
        fixture.componentRef.setInput('isLoading', true);
        const save = vi.fn();
        component.save.subscribe(save);
        component.onSubmit();
        expect(save).not.toHaveBeenCalled();
    });
});
