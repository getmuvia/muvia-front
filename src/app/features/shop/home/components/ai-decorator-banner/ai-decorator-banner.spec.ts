import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiDecoratorBanner } from './ai-decorator-banner';

describe('AiDecoratorBanner', () => {
  let component: AiDecoratorBanner;
  let fixture: ComponentFixture<AiDecoratorBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiDecoratorBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiDecoratorBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
