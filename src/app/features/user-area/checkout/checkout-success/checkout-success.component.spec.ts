import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { CheckoutSuccessComponent } from './checkout-success.component';
describe('CheckoutSuccessComponent server truth',()=>{
  function render(state:string,id:string|null='saved',failed=false) {
    const status=vi.fn().mockReturnValue(failed ? throwError(()=>new Error('offline')) : of({id:'saved',state,orderId:42}));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:TranslationService,useValue:{translate:(key:string)=>key}},
      {provide:FulfillmentService,useValue:{status:()=>of({processing:'Pending',email:'Pending',completedLines:0,totalLines:1})}},
      {provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap(id?{checkout:id}:{})}}},
      {provide:CheckoutService,useValue:{status}}]});
    const fixture=TestBed.createComponent(CheckoutSuccessComponent);fixture.detectChanges();return {fixture,status};
  }
  it('renders received only after server verification',()=>{const {fixture,status}=render('PaymentVerified');expect(status).toHaveBeenCalledWith('saved');expect(fixture.nativeElement.textContent).toContain('Payment received');});
  it('does not claim payment from a success route',()=>{const {fixture}=render('Ready');expect(fixture.nativeElement.textContent).toContain('has not been verified');expect(fixture.nativeElement.textContent).not.toContain('Payment received');});
  it('renders review and suppresses success',()=>{const {fixture}=render('ReviewRequired');expect(fixture.nativeElement.textContent).toContain('needs review');});
  it('reloads a checkout using its durable query identity',()=>{const {fixture,status}=render('PaymentVerified');fixture.componentInstance.refresh();expect(status).toHaveBeenCalledTimes(2);});
  it('handles a missing identity without trusting navigation state',()=>{const {fixture,status}=render('Ready',null);expect(status).not.toHaveBeenCalled();expect(fixture.nativeElement.textContent).toContain('No saved checkout');});
  it('shows uncertainty on server failure',()=>{const {fixture}=render('Ready','saved',true);expect(fixture.nativeElement.textContent).toContain('status is unavailable');});
});
