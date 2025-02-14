import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDropSubscriptionComponent } from './price-drop-subscription.component';

describe('PriceDropSubscriptionComponent', () => {
  let component: PriceDropSubscriptionComponent;
  let fixture: ComponentFixture<PriceDropSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceDropSubscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceDropSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
