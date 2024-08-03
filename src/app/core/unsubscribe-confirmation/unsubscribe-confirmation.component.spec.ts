import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnsubscribeConfirmationComponent } from './unsubscribe-confirmation.component';

describe('UnsubscribeConfirmationComponent', () => {
  let component: UnsubscribeConfirmationComponent;
  let fixture: ComponentFixture<UnsubscribeConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnsubscribeConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnsubscribeConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
