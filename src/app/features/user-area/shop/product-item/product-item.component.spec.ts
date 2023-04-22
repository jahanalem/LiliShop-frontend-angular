import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductItemComponent } from './product-item.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('ProductItemComponent', () => {
  let component: ProductItemComponent;
  let fixture: ComponentFixture<ProductItemComponent>;
  let basketServiceSpy: jasmine.SpyObj<BasketService>;

  beforeEach(async () => {
    const basketServiceMock = jasmine.createSpyObj('BasketService', ['addItemToBasket']);

    await TestBed.configureTestingModule({
      declarations: [ProductItemComponent],
      providers: [
        { provide: BasketService, useValue: basketServiceMock }
      ]
    })
      .compileComponents();

    basketServiceSpy = TestBed.inject(BasketService) as jasmine.SpyObj<BasketService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title of the product', () => {
    const product: IProduct = {
      id: 1,
      name: 'Test Product',
      price: 10,
      description: 'Test Description',
      pictureUrl: 'Test Picture Url',
      productType: 'Test Product Type',
      productBrand: 'Test Product Brand',
      isActive: true,
      productCharacteristics: [],
      productPhotos: []
    };
    component.product = product;
    fixture.detectChanges();
    const productTitleElement: DebugElement = fixture.debugElement.query(By.css('.text-uppercase'));
    const textContent = productTitleElement.nativeElement.textContent;
    expect(textContent).toContain(product.name);
  });

  it('should call addItemToBasket on click', () => {
    const product: IProduct = {
      id: 1,
      name: 'Test Product',
      price: 10,
      description: 'Test Description',
      pictureUrl: 'Test Picture Url',
      productType: 'Test Product Type',
      productBrand: 'Test Product Brand',
      isActive: true,
      productCharacteristics: [],
      productPhotos: []
    };
    component.product = product;
    fixture.detectChanges();
    const addButton: DebugElement = fixture.debugElement.query(By.css('.fa-shopping-cart'));
    addButton.nativeElement.click();
    expect(basketServiceSpy.addItemToBasket).toHaveBeenCalledWith(product);
  });
});
