import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { CheckoutSuccessComponent } from './checkout-success.component';
describe('CheckoutSuccessComponent server truth',()=>{
  function render(state:string,id:string|null='saved',failed=false,progressStatus=vi.fn(()=>of<any>({processing:'Pending',email:'Pending',completedLines:0,totalLines:1}))) {
    const status=vi.fn().mockReturnValue(failed ? throwError(()=>new Error('offline')) : of({id:'saved',state,orderId:42}));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:TranslationService,useValue:{translate:(key:string)=>key}},
      {provide:FulfillmentService,useValue:{status:progressStatus}},
      {provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap(id?{checkout:id}:{})}}},
      {provide:CheckoutService,useValue:{status}}]});
    const fixture=TestBed.createComponent(CheckoutSuccessComponent);fixture.detectChanges();return {fixture,status,progressStatus};
  }
  it('renders received only after server verification',()=>{const {fixture,status}=render('PaymentVerified');expect(status).toHaveBeenCalledWith('saved');expect(fixture.nativeElement.textContent).toContain('Payment received');});
  it('does not claim payment from a success route',()=>{const {fixture}=render('Ready');expect(fixture.nativeElement.textContent).toContain('has not been verified');expect(fixture.nativeElement.textContent).not.toContain('Payment received');});
  it('renders review and suppresses success',()=>{const {fixture}=render('ReviewRequired');expect(fixture.nativeElement.textContent).toContain('needs review');});
  it('reloads a checkout using its durable query identity',()=>{const {fixture,status}=render('PaymentVerified');fixture.componentInstance.refresh();expect(status).toHaveBeenCalledTimes(2);});
  it('handles a missing identity without trusting navigation state',()=>{const {fixture,status}=render('Ready',null);expect(status).not.toHaveBeenCalled();expect(fixture.nativeElement.textContent).toContain('No saved checkout');});
  it('shows uncertainty on server failure',()=>{const {fixture}=render('Ready','saved',true);expect(fixture.nativeElement.textContent).toContain('status is unavailable');});

  beforeEach(()=>vi.useFakeTimers());
  afterEach(()=>vi.useRealTimers());
  it('automatically renders completed inventory and accepted email from server updates',()=>{
    const progress=vi.fn().mockReturnValueOnce(of({processing:'Pending',email:'Pending',completedLines:0,totalLines:1}))
      .mockReturnValueOnce(of({processing:'Complete',email:'Pending',completedLines:1,totalLines:1}))
      .mockReturnValue(of({processing:'Complete',email:'Accepted',completedLines:1,totalLines:1}));
    const {fixture}=render('PaymentVerified','saved',false,progress);
    vi.advanceTimersByTime(2000); fixture.detectChanges();
    expect(fixture.componentInstance.processing()?.email).toBe('Accepted'); expect(progress).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(10000); expect(progress).toHaveBeenCalledTimes(3); fixture.destroy();
  });
  it.each([
    {processing:'Complete',email:'UnknownDelivery'},
    {processing:'Complete',email:'ReviewRequired'},
    {processing:'ReviewRequired',email:'Pending'}
  ])('stops automatic reads when review is required: %o',terminal=>{
    const progress=vi.fn(()=>of<any>({...terminal,completedLines:1,totalLines:1}));
    const {fixture}=render('PaymentVerified','saved',false,progress);
    vi.advanceTimersByTime(30000); expect(progress).toHaveBeenCalledOnce(); fixture.destroy();
  });
  it('does not overlap an in-flight progress request',()=>{
    const inFlight=new Subject<any>(); const progress=vi.fn().mockReturnValue(inFlight);
    const {fixture}=render('PaymentVerified','saved',false,progress);
    vi.advanceTimersByTime(3000); expect(progress).toHaveBeenCalledOnce();
    inFlight.next({processing:'Pending',email:'Pending'}); inFlight.complete();
    vi.advanceTimersByTime(1000); expect(progress).toHaveBeenCalledTimes(2); fixture.destroy();
  });
  it('manual refresh replaces the existing progress timer',()=>{
    const {fixture,progressStatus}=render('PaymentVerified');
    vi.advanceTimersByTime(1000); expect(progressStatus).toHaveBeenCalledTimes(2);
    fixture.componentInstance.refresh(); expect(progressStatus).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(1000); expect(progressStatus).toHaveBeenCalledTimes(4); fixture.destroy();
  });
  it('cancels progress requests and timers when leaving the page',()=>{
    const inFlight=new Subject<any>(); const progress=vi.fn(()=>inFlight);
    const {fixture}=render('PaymentVerified','saved',false,progress); expect(inFlight.observed).toBe(true);
    fixture.destroy(); expect(inFlight.observed).toBe(false);
    vi.advanceTimersByTime(10000); expect(progress).toHaveBeenCalledOnce();
  });
  it('bounds automatic refresh while keeping manual refresh available',()=>{
    const {fixture,progressStatus}=render('PaymentVerified');
    vi.advanceTimersByTime(180000); expect(progressStatus).toHaveBeenCalledTimes(121);
    fixture.componentInstance.refresh(); expect(progressStatus).toHaveBeenCalledTimes(122); fixture.destroy();
  });
  it('keeps payment verification when a later progress read fails',()=>{
    const progress=vi.fn().mockReturnValueOnce(of({processing:'Pending',email:'Pending'}))
      .mockReturnValue(throwError(()=>new Error('offline')));
    const {fixture}=render('PaymentVerified','saved',false,progress);
    vi.advanceTimersByTime(1000); fixture.detectChanges();
    expect(fixture.componentInstance.processingError()).toBe(true);
    expect(fixture.componentInstance.checkout()?.state).toBe('PaymentVerified');
    expect(fixture.nativeElement.textContent).toContain('Payment received'); fixture.destroy();
  });
});
