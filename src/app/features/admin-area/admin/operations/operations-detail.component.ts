import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OperationsService } from 'src/app/core/services/operations.service';
import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { CheckoutDetail, InboxDetail, MailRow, OrderDetail, WorkDetail } from 'src/app/shared/models/operations';
import { OperationsBadgeComponent, OperationsDisplay, OperationsIdComponent, OperationsLinesComponent, OperationsNavComponent, OperationsTextPipe } from './operations-ui';

type Payload = CheckoutDetail|InboxDetail|WorkDetail|OrderDetail|MailRow;
@Component({selector:'app-operations-detail',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[FormsModule,RouterLink,MatButtonModule,MatIconModule,MatFormFieldModule,MatInputModule,MatProgressSpinnerModule,OperationsBadgeComponent,OperationsIdComponent,OperationsLinesComponent,OperationsNavComponent,OperationsTextPipe],templateUrl:'./operations-detail.component.html',styleUrls:['./operations.scss']})
export class OperationsDetailComponent extends OperationsDisplay implements OnInit {
  @Input() kind = 'checkouts';
  private service=inject(OperationsService);private actions=inject(FulfillmentService);private route=inject(ActivatedRoute);private destroy=inject(DestroyRef);
  private reload$=new BehaviorSubject(0);
  readonly checkout=signal<CheckoutDetail|null>(null);readonly receipt=signal<InboxDetail|null>(null);readonly work=signal<WorkDetail|null>(null);readonly order=signal<OrderDetail|null>(null);readonly mail=signal<MailRow|null>(null);
  readonly loading=signal(true);readonly error=signal('');readonly actionError=signal('');readonly busy=signal(false);readonly loadedAt=signal<string|null>(null);
  readonly links=signal<{label:string;path:(string|number)[]}[]>([]);
  readonly moneyRecord=computed(()=>this.order()?.money??this.checkout()?.money??null);
  reason='';id='';backQuery:Record<string,string>={};backPath='/admin/operations/checkouts';
  ngOnInit():void {
    this.kind=this.route.snapshot.data['kind']??this.kind;
    const p=this.route.snapshot.queryParamMap;const from=p.get('returnTo');
    this.backPath=from==='processing'?'/admin/fulfillment':`/admin/operations/${['checkouts','inbox','mail','audit'].includes(from??'')?from:(this.kind==='orders'?'checkouts':this.kind)}`;
    if(this.kind==='processing'&&!from)this.backPath='/admin/fulfillment';
    for(const key of ['page','pageSize','search','state','mailState','timing','verification','mode','scope','sort','direction'])if(p.has(key))this.backQuery[key]=p.get(key)!;
    combineLatest([this.route.paramMap,this.reload$]).pipe(map(([params])=>params.get('id')??''),
      tap(id=>{this.id=id;this.loading.set(true);this.error.set('');this.checkout.set(null);this.receipt.set(null);this.work.set(null);this.order.set(null);this.mail.set(null);this.links.set([]);}),
      switchMap(id=>this.read(id).pipe(map(value=>({value,error:''})),catchError(e=>of({value:null,error:this.failure(e.status)})))),takeUntilDestroyed(this.destroy)
    ).subscribe(({value,error})=>{this.loading.set(false);this.error.set(error);if(!value)return;this.loadedAt.set(new Date().toISOString());
      if(this.kind==='checkouts')this.checkout.set(value as CheckoutDetail);else if(this.kind==='inbox')this.receipt.set(value as InboxDetail);else if(this.kind==='processing')this.work.set(value as WorkDetail);else if(this.kind==='orders')this.order.set(value as OrderDetail);else this.mail.set(value as MailRow);
      this.buildLinks();
    });
  }
  private read(id:string):Observable<Payload> { switch(this.kind){case 'checkouts':return this.service.checkout(id);case 'inbox':return this.service.receipt(id);case 'processing':return this.service.work(id);case 'orders':return this.service.order(id);default:return this.service.mail(id);} }
  get linkQuery(){return {returnTo:this.route.snapshot.queryParamMap.get('returnTo')??this.kind,...this.backQuery};}
  refresh(){this.reload$.next(this.reload$.value+1);}
  canRetry(state?:string){return state==='Retry'||state==='ReviewRequired';}
  retry(email=false){const d=this.work();const item=email?d?.email:d?.execution;if(!d||!item||!this.canRetry(item.state)||!this.reason.trim()||this.busy())return;
    this.busy.set(true);this.actionError.set('');this.actions.retry(d.id,item.revision,this.reason.trim(),email).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:()=>{this.busy.set(false);this.reason='';this.refresh();},error:e=>{this.busy.set(false);this.actionError.set(e.status===409?'ActionConflict':'ActionFailed');}});
  }
  private buildLinks(){const c=this.checkout(),r=this.receipt(),w=this.work(),o=this.order(),m=this.mail();const list:{label:string;path:(string|number)[]}[]=[];
    const orderId=c?.checkout.orderId??r?.orderId??w?.orderId??m?.orderId;
    const checkoutId=r?.checkoutId??w?.checkoutId??o?.checkoutId??m?.checkoutId;
    const h=c?.handoffId??w?.id??o?.handoffId??m?.handoffId;
    const invoice=c?.invoiceId??w?.execution?.invoiceId??o?.invoiceId??m?.invoiceId;
    if(orderId)list.push({label:'Order',path:['/admin/operations/orders',orderId]});if(checkoutId)list.push({label:'Checkout',path:['/admin/operations/checkouts',checkoutId]});
    if(h&&this.kind!=='processing')list.push({label:'processing',path:['/admin/fulfillment',h]});if(invoice)list.push({label:'Invoice',path:['/admin/invoices',invoice]});if(w?.email)list.push({label:'mail',path:['/admin/operations/mail',w.email.id]});this.links.set(list);
  }
}
