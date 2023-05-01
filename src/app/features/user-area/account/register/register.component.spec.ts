import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AccountService } from 'src/app/core/services/account.service';
import { IUser } from 'src/app/shared/models/user';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';


describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let accountService: AccountService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const accountServiceSpy = jasmine.createSpyObj<AccountService>('AccountService', ['register', 'checkEmailExists']);
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent, TextInputComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    accountService = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the registerForm', () => {
    component.ngOnInit();
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm instanceof FormGroup).toBeTruthy();
  });

  it('should call accountService.register() and navigate to /shop on successful registration', (done) => {
    component.ngOnInit();
    const formData = {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    component.registerForm.setValue(formData);

    const dummyUser: IUser = {
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      role: 'user',
      token: 'dummy-token',
    };

    (accountService.register as jasmine.Spy).and.returnValue(of(dummyUser));

    component.onSubmit();

    accountService.register(formData).subscribe(() => {
      expect(accountService.register).toHaveBeenCalledWith(formData);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/shop');
      done();
    });
  });

  it('should display error messages on failed registration', (done) => {
    component.ngOnInit();
    const formData = {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    component.registerForm.setValue(formData);
    const errorResponse = { errors: ['Error 1', 'Error 2'] };

    (accountService.register as jasmine.Spy).and.returnValue(throwError(errorResponse));

    component.onSubmit();

    accountService.register(formData).subscribe(
      () => { },
      (_error) => {
        expect(accountService.register).toHaveBeenCalledWith(formData);
        expect(component.errors).toEqual(errorResponse.errors);
        done();
      }
    );
  });
});
