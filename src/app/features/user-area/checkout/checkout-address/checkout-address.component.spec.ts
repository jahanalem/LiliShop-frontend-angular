import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { CheckoutAddressComponent } from './checkout-address.component';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';


describe('CheckoutAddressComponent', () => {
  let component: CheckoutAddressComponent;
  let fixture: ComponentFixture<CheckoutAddressComponent>;
  let mockAccountService: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    mockAccountService = jasmine.createSpyObj('AccountService', ['updateAddress']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        ToastrModule.forRoot(),
        MatInputModule,
        MatFormFieldModule
      ],
      declarations: [CheckoutAddressComponent, TextInputComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutAddressComponent);
    component = fixture.componentInstance;
    component.checkoutForm = new FormGroup({
      addressForm: new FormGroup({
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required),
        street: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
        state: new FormControl('', Validators.required),
        zipCode: new FormControl('', Validators.required)
      })
    });
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save user address on success', () => {
    const testAddress: IAddress = {
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St.',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    }; // mock an IAddress object
    const component = fixture.debugElement.children[0].componentInstance as CheckoutAddressComponent;
    mockAccountService.updateAddress.and.returnValue(of(testAddress));

    component.saveUserAddress();

    expect(mockAccountService.updateAddress).toHaveBeenCalled();
  });

  it('should show error message on updateAddress error', () => {
    const testError = { message: 'Error updating address.' };
    const component = fixture.debugElement.children[0].componentInstance as CheckoutAddressComponent;
    mockAccountService.updateAddress.and.returnValue(throwError(() => testError));

    component.saveUserAddress();

    expect(mockAccountService.updateAddress).toHaveBeenCalled();
  });
});
