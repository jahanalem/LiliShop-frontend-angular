import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUsMessagesComponent } from './contact-us-messages.component';

describe('ContactUsMessagesComponent', () => {
  let component: ContactUsMessagesComponent;
  let fixture: ComponentFixture<ContactUsMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactUsMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactUsMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
