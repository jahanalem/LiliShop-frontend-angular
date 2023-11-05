import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavBarComponent } from './nav-bar.component';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { Subject, of } from 'rxjs';
import { IUser } from 'src/app/shared/models/user';

describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let fixture: ComponentFixture<NavBarComponent>;
  let basketServiceSpy: jasmine.SpyObj<BasketService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let currentUserSubject = new Subject<IUser | null>();

  beforeEach(async () => {
    const basketServiceMock = jasmine.createSpyObj('BasketService', [], { basket$: of(null) });
    const accountServiceMock = jasmine.createSpyObj('AccountService', ['logout'], { currentUser$: currentUserSubject.asObservable() });

    await TestBed.configureTestingModule({
      declarations: [NavBarComponent],
      providers: [
        { provide: BasketService, useValue: basketServiceMock },
        { provide: AccountService, useValue: accountServiceMock }
      ]
    })
      .compileComponents();

    basketServiceSpy = TestBed.inject(BasketService) as jasmine.SpyObj<BasketService>;
    accountServiceSpy = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle isCollapsed on toggleCollapse()', () => {
    component.isCollapsed = true;
    component.toggleCollapse();
    expect(component.isCollapsed).toBe(false);

    component.toggleCollapse();
    expect(component.isCollapsed).toBe(true);
  });

  it('should call accountService.logout() on logout()', () => {
    component.logout();
    expect(accountServiceSpy.logout).toHaveBeenCalled();
  });

  it('should assign basket$ from the BasketService', (done) => {
    const basketStream = of(null);
    basketServiceSpy.basket$ = basketStream;
    component = TestBed.createComponent(NavBarComponent).componentInstance;

    component.basket$.subscribe(componentBasketValue => {
      basketStream.subscribe(basketServiceValue => {
        expect(componentBasketValue).toEqual(basketServiceValue);
        done();
      });
    });
  });

  it('should update currentUserSource when currentUser$ emits', (done) => {
    const testUser: IUser = {
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
      token: 'test-token'
    };

    component.ngOnInit();
    currentUserSubject.next(testUser);
    component.currentUser$.subscribe(user => {
      expect(user).toEqual(testUser);
      done();
    });
  });
});
