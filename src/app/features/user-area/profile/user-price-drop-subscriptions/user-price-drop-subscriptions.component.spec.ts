import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPriceDropSubscriptionsComponent } from './user-price-drop-subscriptions.component';

describe('UserPriceDropSubscriptionsComponent', () => {
  let component: UserPriceDropSubscriptionsComponent;
  let fixture: ComponentFixture<UserPriceDropSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPriceDropSubscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPriceDropSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
