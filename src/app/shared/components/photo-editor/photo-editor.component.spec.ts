import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { PhotoEditorComponent } from './photo-editor.component';
import { AccountService } from 'src/app/core/services/account.service';
import { ProductService } from 'src/app/core/services/product.service';
import { IProduct } from 'src/app/shared/models/product';
import { IPhotoAttributeValueOption } from 'src/app/shared/models/productPhoto';

describe('PhotoEditorComponent (attribute-value tags)', () => {
  let fixture: ComponentFixture<PhotoEditorComponent>;
  let component: PhotoEditorComponent;
  let productServiceMock: {
    getAssignablePhotoAttributeValues: ReturnType<typeof vi.fn>;
    setPhotoAttributeValues: ReturnType<typeof vi.fn>;
    setMainPhoto: ReturnType<typeof vi.fn>;
    deletePhoto: ReturnType<typeof vi.fn>;
  };

  const YELLOW = 201, GREEN = 202, TROPICAL = 301, SIZE_L = 101;

  const options: IPhotoAttributeValueOption[] = [
    { attributeId: 20, attributeName: 'Color', displayOrder: 10, valueId: YELLOW, valueName: 'Yellow', colorHex: '#FFD700', sortOrder: 10 },
    { attributeId: 20, attributeName: 'Color', displayOrder: 10, valueId: GREEN, valueName: 'Green', colorHex: '#2E7D32', sortOrder: 20 },
    { attributeId: 30, attributeName: 'Pattern', displayOrder: 20, valueId: TROPICAL, valueName: 'Tropical', colorHex: null, sortOrder: 10 },
    { attributeId: 10, attributeName: 'Size', displayOrder: 30, valueId: SIZE_L, valueName: 'Large', colorHex: null, sortOrder: 40 }
  ];

  function buildProduct(): IProduct {
    return {
      id: 60, name: 'Beach Shirt', description: 'd', price: 70,
      pictureUrl: 'main.png', picturePublicId: 'main', productTypeId: 1, productBrandId: 1,
      isActive: true, hasVariants: true,
      productPhotos: [
        { id: 1, url: 'p1.png', publicId: 'p1', isMain: true, attributeValueIds: [YELLOW] },
        { id: 2, url: 'p2.png', publicId: 'p2', isMain: false, attributeValueIds: [] }
      ]
    };
  }

  beforeEach(async () => {
    productServiceMock = {
      getAssignablePhotoAttributeValues: vi.fn().mockReturnValue(of(options)),
      setPhotoAttributeValues: vi.fn().mockImplementation((_productId: number, photoId: number, ids: number[]) =>
        of({ id: photoId, url: `p${photoId}.png`, publicId: `p${photoId}`, isMain: false, attributeValueIds: ids })),
      setMainPhoto: vi.fn().mockReturnValue(of({})),
      deletePhoto: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, PhotoEditorComponent],
      providers: [
        // A null user keeps the file uploader out of the way; tagging is what is under test.
        { provide: AccountService, useValue: { currentUser$: of(null) } },
        { provide: ProductService, useValue: productServiceMock },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', buildProduct());
    fixture.detectChanges();
  });

  it('loads only the values assignable to this product', () => {
    expect(productServiceMock.getAssignablePhotoAttributeValues).toHaveBeenCalledWith(60);
    expect(component.assignableValues().length).toBe(4);
  });

  it('renders the assigned values as attribute-qualified chips', () => {
    const chips = fixture.nativeElement.querySelectorAll('.photo-tag__text');

    // Photo 1 carries Yellow; photo 2 carries nothing.
    expect(chips.length).toBe(1);
    expect(chips[0].textContent.trim()).toBe('Color: Yellow');
  });

  it('shows an empty-state for a photo without tags', () => {
    const empties = fixture.nativeElement.querySelectorAll('.photo-tags__empty');
    expect(empties.length).toBe(1);
  });

  it('adds a tag and persists the complete new set', () => {
    component.openTagPicker(1);
    fixture.detectChanges();

    component.addTag(1, TROPICAL);

    expect(productServiceMock.setPhotoAttributeValues).toHaveBeenCalledWith(60, 1, [YELLOW, TROPICAL]);
    expect(component.tagsByPhotoId().get(1)).toEqual([YELLOW, TROPICAL]);
  });

  it('renders the newly added chip', () => {
    component.addTag(2, GREEN);
    fixture.detectChanges();

    const texts = Array.from(fixture.nativeElement.querySelectorAll('.photo-tag__text'))
      .map((el: any) => el.textContent.trim());
    expect(texts).toContain('Color: Green');
  });

  it('removes a tag and persists the remaining set', () => {
    component.removeTag(1, YELLOW);

    expect(productServiceMock.setPhotoAttributeValues).toHaveBeenCalledWith(60, 1, []);
    expect(component.tagsByPhotoId().get(1)).toEqual([]);
  });

  it('removes the chip from the DOM after removal', () => {
    component.removeTag(1, YELLOW);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.photo-tag__text').length).toBe(0);
  });

  it('never offers a value that is already assigned to the photo', () => {
    component.openTagPicker(1);

    expect(component.pickerOptions().map(o => o.valueId)).not.toContain(YELLOW);
    expect(component.pickerOptions().map(o => o.valueId)).toContain(TROPICAL);
  });

  it('filters the available values by the search box', () => {
    component.openTagPicker(2);

    component.onTagSearch('trop');
    expect(component.pickerOptions().map(o => o.valueName)).toEqual(['Tropical']);

    // The attribute name is searchable too, so "color" narrows to the colour values.
    component.onTagSearch('color');
    expect(component.pickerOptions().map(o => o.valueName)).toEqual(['Yellow', 'Green']);

    component.onTagSearch('');
    expect(component.pickerOptions().length).toBe(4);
  });

  it('ignores a duplicate add instead of sending it to the server', () => {
    component.addTag(1, YELLOW); // already assigned

    expect(productServiceMock.setPhotoAttributeValues).not.toHaveBeenCalled();
  });

  it('toggles the picker open and closed', () => {
    component.openTagPicker(1);
    expect(component.openPickerPhotoId()).toBe(1);

    component.openTagPicker(1);
    expect(component.openPickerPhotoId()).toBeNull();

    component.openTagPicker(2);
    component.closeTagPicker();
    expect(component.openPickerPhotoId()).toBeNull();
  });

  it('surfaces an error and keeps the previous tags when the save fails', () => {
    productServiceMock.setPhotoAttributeValues.mockReturnValue(throwError(() => new Error('boom')));

    component.addTag(2, GREEN);

    expect(component.tagError()).not.toBe('');
    expect(component.tagsByPhotoId().get(2)).toEqual([]);
  });

  it('drops the local tags when its photo is deleted', () => {
    component.deletePhoto(1);

    expect(productServiceMock.deletePhoto).toHaveBeenCalledWith(1);
    expect(component.tagsByPhotoId().has(1)).toBe(false);
  });

  describe('refreshing after a variant change (no page reload)', () => {
    // Reported bug: a product used only "Color: Red"; the admin saved a new variant with
    // "Color: Yellow"; Yellow was missing from "Assign values" until the browser was refreshed.
    // The parent bumps reloadToken after a persisted variant change, which must re-fetch.

    const YELLOW_NEW = 203;
    const withYellow: IPhotoAttributeValueOption[] = [
      ...options,
      { attributeId: 20, attributeName: 'Color', displayOrder: 10, valueId: YELLOW_NEW, valueName: 'Sunflower', colorHex: '#FFC107', sortOrder: 30 }
    ];

    it('loads the values exactly once until something actually changes', () => {
      expect(productServiceMock.getAssignablePhotoAttributeValues).toHaveBeenCalledTimes(1);

      // Re-rendering with the same product and the same token must not re-issue the request.
      fixture.detectChanges();
      expect(productServiceMock.getAssignablePhotoAttributeValues).toHaveBeenCalledTimes(1);
    });

    it('re-fetches and offers the newly used value when the token is bumped', () => {
      component.openTagPicker(2);
      expect(component.pickerOptions().map(o => o.valueId)).not.toContain(YELLOW_NEW);

      // A variant using the new value was saved: parent increments reloadToken.
      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(of(withYellow));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      expect(productServiceMock.getAssignablePhotoAttributeValues).toHaveBeenCalledTimes(2);
      expect(component.pickerOptions().map(o => o.valueId)).toContain(YELLOW_NEW);
    });

    it('preserves already assigned tags across the refresh', () => {
      expect(component.tagsByPhotoId().get(1)).toEqual([YELLOW]);

      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(of(withYellow));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      expect(component.tagsByPhotoId().get(1)).toEqual([YELLOW]);
      const chips = Array.from(fixture.nativeElement.querySelectorAll('.photo-tag__text'))
        .map((el: any) => el.textContent.trim());
      expect(chips).toEqual(['Color: Yellow']);
    });

    it('does not duplicate options that were already present', () => {
      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(of(withYellow));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      const ids = component.assignableValues().map(o => o.valueId);
      expect(new Set(ids).size).toBe(ids.length);

      component.openTagPicker(2);
      const pickerIds = component.pickerOptions().map(o => o.valueId);
      expect(new Set(pickerIds).size).toBe(pickerIds.length);
    });

    it('drops a value from the picker once its last variant is gone', () => {
      // Deleting the last variant that used Tropical makes it un-assignable.
      const withoutTropical = options.filter(o => o.valueId !== TROPICAL);
      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(of(withoutTropical));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      component.openTagPicker(2);
      expect(component.pickerOptions().map(o => o.valueId)).not.toContain(TROPICAL);
    });

    it('keeps an assigned chip readable even after its value stops being assignable', () => {
      component.addTag(2, TROPICAL);
      fixture.detectChanges();

      const withoutTropical = options.filter(o => o.valueId !== TROPICAL);
      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(of(withoutTropical));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      // The tag still exists server-side, so its chip must keep its label and stay removable.
      expect(component.tagsByPhotoId().get(2)).toEqual([TROPICAL]);
      const chips = Array.from(fixture.nativeElement.querySelectorAll('.photo-tag__text'))
        .map((el: any) => el.textContent.trim());
      expect(chips).toContain('Pattern: Tropical');
    });

    it('keeps existing chips when the refresh request fails', () => {
      productServiceMock.getAssignablePhotoAttributeValues.mockReturnValue(throwError(() => new Error('offline')));
      fixture.componentRef.setInput('reloadToken', 1);
      fixture.detectChanges();

      const chips = Array.from(fixture.nativeElement.querySelectorAll('.photo-tag__text'))
        .map((el: any) => el.textContent.trim());
      expect(chips).toEqual(['Color: Yellow']);
      expect(component.tagsByPhotoId().get(1)).toEqual([YELLOW]);
    });
  });

  it('keeps existing photo management intact (main photo selection)', () => {
    const product = component.product()!;
    component.setMainPhoto(product.productPhotos[1]);

    expect(productServiceMock.setMainPhoto).toHaveBeenCalledWith(2);
    expect(product.productPhotos[1].isMain).toBe(true);
    expect(product.productPhotos[0].isMain).toBe(false);
  });
});
