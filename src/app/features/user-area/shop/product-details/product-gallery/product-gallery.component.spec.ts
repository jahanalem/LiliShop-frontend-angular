import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideCloudinaryLoader } from '@angular/common';

import { ProductGalleryComponent } from './product-gallery.component';
import { IProductPhoto } from 'src/app/shared/models/productPhoto';

function photo(partial: Partial<IProductPhoto> & { id: number }): IProductPhoto {
  return {
    id: partial.id,
    url: partial.url ?? `https://cdn/${partial.id}.jpg`,
    publicId: partial.publicId ?? `pub-${partial.id}`,
    isMain: partial.isMain ?? false
  };
}

describe('ProductGalleryComponent', () => {
  let fixture: ComponentFixture<ProductGalleryComponent>;
  let component: ProductGalleryComponent;

  /** Provide the product-level fallback image (empty by default, so most tests see only `photos`). */
  function setFallback(url: string, publicId: string): void {
    fixture.componentRef.setInput('fallbackUrl', url);
    fixture.componentRef.setInput('fallbackPublicId', publicId);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductGalleryComponent],
      providers: [provideCloudinaryLoader('https://res.cloudinary.com/rouhi')]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('productName', 'Test Product');
  });

  it('places the main photo first, regardless of its position in the input', () => {
    fixture.componentRef.setInput('photos', [
      photo({ id: 1, isMain: false }),
      photo({ id: 2, isMain: true }),
      photo({ id: 3, isMain: false })
    ]);

    const images = component.images();
    expect(images.map(i => i.photoId)).toEqual([2, 1, 3]);
    expect(component.activeImage()?.photoId).toBe(2);
  });

  it('falls back to pictureUrl when productPhotos is empty', () => {
    setFallback('https://cdn/fallback.jpg', 'pub-fallback');
    fixture.componentRef.setInput('photos', []);

    const images = component.images();
    expect(images.length).toBe(1);
    expect(images[0].photoId).toBeNull();
    expect(images[0].publicId).toBe('pub-fallback');
  });

  it('does not break when productPhotos is null or undefined', () => {
    setFallback('https://cdn/fallback.jpg', 'pub-fallback');

    fixture.componentRef.setInput('photos', null);
    expect(component.count()).toBe(1); // fallback only
    expect(component.activeImage()?.publicId).toBe('pub-fallback');

    fixture.componentRef.setInput('photos', undefined);
    expect(component.count()).toBe(1);
  });

  it('removes duplicate images (by public id, else URL)', () => {
    fixture.componentRef.setInput('photos', [
      photo({ id: 1, publicId: 'dup', url: 'https://cdn/a.jpg' }),
      photo({ id: 2, publicId: 'dup', url: 'https://cdn/b.jpg' }), // same public id
      photo({ id: 3, publicId: '', url: 'https://cdn/c.jpg' }),
      photo({ id: 4, publicId: '', url: 'https://cdn/c.jpg' })     // same URL, no public id
    ]);

    expect(component.images().map(i => i.photoId)).toEqual([1, 3]);
  });

  it('does not duplicate the fallback when it is already among the photos', () => {
    setFallback('https://cdn/fallback.jpg', 'pub-fallback');
    fixture.componentRef.setInput('photos', [
      photo({ id: 1, publicId: 'pub-fallback', url: 'https://cdn/fallback.jpg', isMain: true })
    ]);

    const images = component.images();
    expect(images.length).toBe(1);
    expect(images[0].photoId).toBe(1);
  });

  it('keeps original order and appends the fallback when no photo is marked main', () => {
    setFallback('https://cdn/fallback.jpg', 'pub-fallback');
    fixture.componentRef.setInput('photos', [
      photo({ id: 1, isMain: false }),
      photo({ id: 2, isMain: false })
    ]);

    // Photos 1 and 2 in order, then the (distinct) fallback appended last.
    expect(component.images().map(i => i.photoId)).toEqual([1, 2, null]);
  });

  it('selecting a thumbnail makes it the active image', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })]);

    component.select(1);
    expect(component.activeIndex()).toBe(1);
    expect(component.activeImage()?.photoId).toBe(2);
  });

  it('navigates with next() and prev()', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })]);

    expect(component.activeIndex()).toBe(0);
    component.next();
    expect(component.activeIndex()).toBe(1);
    component.next();
    expect(component.activeIndex()).toBe(2);
    component.prev();
    expect(component.activeIndex()).toBe(1);
  });

  it('stops at the ends consistently (no wrap-around)', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 })]);

    // At the first image, prev() is a no-op.
    expect(component.canGoPrev()).toBe(false);
    component.prev();
    expect(component.activeIndex()).toBe(0);

    // Move to the last image; next() is then a no-op.
    component.next();
    component.next();
    expect(component.activeIndex()).toBe(1);
    expect(component.canGoNext()).toBe(false);
  });

  it('hides navigation controls when there is only one image', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 })]);
    fixture.detectChanges();

    expect(component.count()).toBe(1);
    expect(component.hasMultiple()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.gallery__nav').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.gallery__thumb').length).toBe(0);
  });

  it('renders a thumbnail per image and navigation when several images exist', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.gallery__thumb').length).toBe(component.count());
    expect(fixture.nativeElement.querySelectorAll('.gallery__nav').length).toBe(2);
  });

  it('resets the active image when the product changes externally', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })]);
    component.select(2);
    expect(component.activeIndex()).toBe(2);

    // A different product is loaded into the same gallery instance.
    fixture.componentRef.setInput('photos', [photo({ id: 10, isMain: true }), photo({ id: 11 })]);

    expect(component.activeIndex()).toBe(0);
    expect(component.activeImage()?.photoId).toBe(10);
  });

  it('keeps only the active image and its neighbours in the stage window', () => {
    fixture.componentRef.setInput('photos', [
      photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 }), photo({ id: 4 }), photo({ id: 5 })
    ]);

    component.select(2);
    expect(component.stageWindow().map(i => i.index)).toEqual([1, 2, 3]);

    component.select(0);
    expect(component.stageWindow().map(i => i.index)).toEqual([0, 1]);
  });

  it('flags a broken image and reports it via isBroken', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 })]);
    const key = component.images()[0].key;

    expect(component.isBroken(key)).toBe(false);
    component.onImageError(key);
    expect(component.isBroken(key)).toBe(true);
  });

  it('builds product-scoped, position-aware alt text', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 })]);
    expect(component.altFor(component.images()[1])).toBe('Test Product — image 2 of 2');

    // Single image: alt is just the product name.
    fixture.componentRef.setInput('photos', [photo({ id: 1 })]);
    expect(component.altFor(component.images()[0])).toBe('Test Product');
  });

  it('honors activePhotoId as a programmatic selection hook', () => {
    fixture.componentRef.setInput('photos', [photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })]);
    fixture.componentRef.setInput('activePhotoId', 3);

    expect(component.activeImage()?.photoId).toBe(3);
  });
});
