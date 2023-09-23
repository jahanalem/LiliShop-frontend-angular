import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTypesComponent } from './product-types.component';

describe('ProductTypesComponent', () => {
  let component: ProductTypesComponent;
  let fixture: ComponentFixture<ProductTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductTypesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
