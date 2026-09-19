import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarEditModal } from './sidebar-edit-modal';

describe('SidebarEditModal validation', () => {
  let component: SidebarEditModal;
  let fixture: ComponentFixture<SidebarEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarEditModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarEditModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('initialData', {
      aboutMe: '',
      businessHours: {},
      socialLinks: [],
    });
    fixture.detectChanges();
  });

  it('allows saving without social links and omits an untouched empty row', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');
    component.addSocialLink();
    component.form.get('aboutMe')?.setValue('Diseño y fabricación de muebles.');

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
      aboutMe: 'Diseño y fabricación de muebles.',
      socialLinks: [],
    }));
  });

  it('requires a complete http or https URL when a social link is started', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');
    component.addSocialLink({ name: 'Instagram', url: 'instagram.com/muvia', icon: 'instagram' });

    component.onSubmit();
    fixture.detectChanges();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(component.isSocialFieldInvalid(0, 'url')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('http:// o https://');
  });
});
