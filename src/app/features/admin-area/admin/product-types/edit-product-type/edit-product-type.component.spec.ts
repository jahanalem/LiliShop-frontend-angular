import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProductTypeComponent } from './edit-product-type.component';

describe('EditProductTypeComponent', () => {
  let component: EditProductTypeComponent;
  let fixture: ComponentFixture<EditProductTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditProductTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProductTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
