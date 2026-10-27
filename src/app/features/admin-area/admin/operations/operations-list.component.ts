import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, forkJoin, debounceTime, distinctUntilChanged, map, of, Subject, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OperationsService } from 'src/app/core/services/operations.service';
import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { WorkerControl } from 'src/app/shared/models/fulfillment';
import { AuditRow, CheckoutRow, CHECKOUT_STATES, InboxRow, INBOX_STATES, MailRow, MAIL_STATES, OperationsKind, OperationsQuery, OperationsRow, OperationsSummary, PROCESSING_STATES, WorkRow } from 'src/app/shared/models/operations';
import { OperationsBadgeComponent, OperationsDisplay, OperationsNavComponent, OperationsTextPipe } from './operations-ui';

interface DisplayRow { key: string; title: string; secondary: string; state: string; mailState: string|null; evidence: string; when: string; timing: string; reason: string|null; route: (string|number)[]|null; orderId: number|null; }
@Component({selector:'app-operations-list',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[FormsModule,RouterLink,MatButtonModule,MatIconModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatPaginatorModule,MatProgressSpinnerModule,OperationsBadgeComponent,OperationsNavComponent,OperationsTextPipe],templateUrl:'./operations-list.component.html',styleUrls:['./operations.scss']})
export class OperationsListComponent extends OperationsDisplay implements OnInit {
  @Input() kind: OperationsKind = 'checkouts';
  private service = inject(OperationsService); private work = inject(FulfillmentService);
  private route = inject(ActivatedRoute); private router = inject(Router); private destroy = inject(DestroyRef);
  private reload$ = new BehaviorSubject(0); private search$ = new Subject<string>();
  readonly rows = signal<DisplayRow[]>([]); readonly count = signal(0); readonly loading = signal(true); readonly error = signal('');
  readonly asOf = signal<string|null>(null); readonly summary = signal<OperationsSummary|null>(null); readonly control = signal<WorkerControl|null>(null);
  readonly contextError = signal(false);
  readonly busy = signal(false); readonly actionError = signal(''); reason = '';
  readonly mailStates = MAIL_STATES; readonly timings = ['Due','Scheduled','LeaseExpired'];
  query: OperationsQuery = {page:1,pageSize:25,search:'',state:'',mailState:'',timing:'',verification:'',mode:'',scope:'',sort:'created',direction:'desc'};
  get states() { return this.kind === 'checkouts' ? CHECKOUT_STATES : this.kind === 'inbox' ? INBOX_STATES : PROCESSING_STATES; }
  get title() { return this.t(this.kind); }
  get intro() { return this.t(({checkouts:'CheckoutsIntro',inbox:'InboxIntro',processing:'ProcessingIntro',mail:'MailIntro',audit:'AuditIntro'})[this.kind]); }
  get sorts() { return this.kind === 'checkouts' ? ['created','expires','state'] : this.kind === 'inbox' ? ['created','state','attempts'] : this.kind === 'audit' ? ['created','revision'] : ['created','updated','state']; }
  get filtered() { return !!(this.query.search || this.query.state || this.query.mailState || this.query.timing || this.query.verification || this.query.mode || this.query.scope); }
  get evidenceLabel() { return this.kind === 'checkouts' ? 'ProviderAmount' : this.kind === 'processing' ? 'TotalLines' : this.kind === 'audit' ? 'Revision' : 'Attempts'; }
  ngOnInit(): void {
    this.kind = this.route.snapshot.data['kind'] ?? this.kind;
    this.loadContext();
    this.search$.pipe(debounceTime(350),distinctUntilChanged(),takeUntilDestroyed(this.destroy)).subscribe(search=>this.change({search:search.trim(),page:1}));
    combineLatest([this.route.queryParamMap,this.reload$]).pipe(
      map(([p])=>({page:Number(p.get('page')??1),pageSize:Number(p.get('pageSize')??25),search:p.get('search')??'',state:p.get('state')??'',mailState:p.get('mailState')??'',timing:p.get('timing')??'',verification:p.get('verification')??'',mode:p.get('mode')??'',scope:p.get('scope')??'',sort:p.get('sort')??'created',direction:p.get('direction')??'desc'})),
      tap(q=>{this.query=q;this.loading.set(true);this.error.set('');}),
      switchMap(q=>this.service.list(this.kind,q).pipe(map(page=>({page,error:''})),catchError(e=>of({page:null,error:this.failure(e.status)})))),takeUntilDestroyed(this.destroy)
    ).subscribe(({page,error})=>{this.loading.set(false);this.error.set(error);this.rows.set(page?.data.map(x=>this.display(x))??[]);this.count.set(page?.count??0);this.asOf.set(page?.asOf??null);});
  }
  search(value: string) { this.search$.next(value); }
  change(values: Partial<OperationsQuery>) { const query={...this.query,...values};void this.router.navigate([], {relativeTo:this.route,queryParams:query}); }
  filter(values: Partial<OperationsQuery>) { this.change({...values,page:1}); }
  paginate(e: PageEvent) { this.change({page:e.pageIndex+1,pageSize:e.pageSize}); }
  clear() { void this.router.navigate([], {relativeTo:this.route,queryParams:{}}); }
  refresh() { this.reload$.next(this.reload$.value+1); }
  private loadContext() {
    this.reload$.pipe(switchMap(()=>forkJoin({
      summary:this.service.summary().pipe(catchError(()=>of(null))),
      control:this.kind==='processing'?this.work.control().pipe(catchError(()=>of(null))):of(null)
    })),takeUntilDestroyed(this.destroy)).subscribe(({summary,control})=>{
      this.summary.set(summary);this.control.set(control);
      this.contextError.set(!summary||(this.kind==='processing'&&!control));
    });
  }
  detailQuery() { return {...this.query,returnTo:this.kind}; }
  toggle() {
    const c=this.control();if(!c || this.busy() || !this.reason.trim())return;
    this.busy.set(true);this.actionError.set('');
    this.work.updateControl(c.revision,!c.enabled,this.reason.trim()).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:x=>{this.control.set(x);this.reason='';this.busy.set(false);this.refresh();},error:e=>{this.busy.set(false);this.actionError.set(e.status===409?'ActionConflict':'ActionFailed');}});
  }
  private display(item: OperationsRow): DisplayRow {
    if(this.kind==='checkouts') {const x=item as CheckoutRow;return {key:x.id,title:x.orderId ? `${this.t('Order')} #${x.orderId}` : this.t('NoOrder'),secondary:x.id,state:x.state,mailState:null,evidence:this.minor(x.amountMinor,x.currency),when:x.createdAt,timing:x.verifiedAt ? 'verified':x.attemptId?'unverified':'missing',reason:x.reason,route:['/admin/operations/checkouts',x.id],orderId:x.orderId};}
    if(this.kind==='inbox') {const x=item as InboxRow;return {key:String(x.id),title:x.eventType,secondary:x.eventId,state:x.state,mailState:null,evidence:String(x.deliveryAttempts),when:x.receivedAt,timing:x.timing,reason:x.reason,route:['/admin/operations/inbox',x.id],orderId:null};}
    if(this.kind==='processing') {const x=item as WorkRow;return {key:x.id,title:`${this.t('Order')} #${x.orderId}`,secondary:x.id,state:x.state,mailState:x.emailState,evidence:`${x.completedLines} / ${x.totalLines}`,when:x.updatedAt??x.createdAt,timing:x.timing,reason:x.reason,route:['/admin/fulfillment',x.id],orderId:x.orderId};}
    if(this.kind==='mail') {const x=item as MailRow;return {key:x.id,title:`${this.t('Invoice')} #${x.invoiceId}`,secondary:x.id,state:x.state,mailState:x.processingState,evidence:String(x.attempts),when:x.updatedAt,timing:x.timing,reason:x.reason,route:['/admin/operations/mail',x.id],orderId:x.orderId};}
    const x=item as AuditRow;return {key:`${x.scope}-${x.id}`,title:this.t(x.action),secondary:`${this.t('Actor')}: ${x.actor}`,state:x.scope,mailState:null,evidence:x.previousRevision==null ? String(x.revision) : `${x.previousRevision} → ${x.revision}`,when:x.recordedAt,timing:'None',reason:x.reason,route:x.handoffId?['/admin/fulfillment',x.handoffId]:null,orderId:null};
  }
}
