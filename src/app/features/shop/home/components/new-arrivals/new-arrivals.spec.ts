import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { NewArrivals } from './new-arrivals';
import { ProductService } from '@core/services/product/product';

describe('NewArrivals', () => {
  let component: NewArrivals;
  let fixture: ComponentFixture<NewArrivals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewArrivals],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: {
            searchProducts: () =>
              of({ data: [], total: 0, page: 1, limit: 4, totalPages: 0 }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewArrivals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
