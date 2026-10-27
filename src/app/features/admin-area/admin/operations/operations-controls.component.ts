import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, of, switchMap, tap } from 'rxjs';
import { OperationsService } from 'src/app/core/services/operations.service';
import { ControlsStatus } from 'src/app/shared/models/operations';
import { OperationsBadgeComponent, OperationsDisplay, OperationsNavComponent, OperationsTextPipe } from './operations-ui';

@Component({standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[RouterLink,MatButtonModule,MatIconModule,OperationsBadgeComponent,OperationsNavComponent,OperationsTextPipe],template:`
<section class="operations"><div class="heading"><div><p class="eyebrow">LiliShop · {{ 'ReadOnly' | opsText }}</p><h1>{{ 'controls' | opsText }}</h1><p class="intro">{{ 'ControlsHelp' | opsText }}</p></div><button mat-stroked-button (click)="refresh()" [disabled]="loading()"><mat-icon>refresh</mat-icon>{{ 'Refresh' | opsText }}</button></div><app-ops-nav />
@if(error()){<p class="error" role="alert">{{ error() | opsText }}</p>}@else if(loading()){<p role="status">{{ 'Loading' | opsText }}</p>}@else if(data();as d){<div class="details-grid"><section class="panel"><h2>{{ 'checkout' | opsText }}</h2>@if(d.checkout;as c){<dl class="facts"><dt>{{ 'CheckoutEnabled' | opsText }}</dt><dd><app-ops-badge [value]="c.newFlowEnabled?'Enabled':'Disabled'" /></dd><dt>{{ 'StartsPaused' | opsText }}</dt><dd><app-ops-badge [value]="c.startsPaused?'Paused':'Open'" /></dd><dt>{{ 'Revision' | opsText }}</dt><dd>{{ c.revision }}</dd><dt>{{ 'ChangedBy' | opsText }}</dt><dd>{{ c.changedBy }}</dd><dt>{{ 'ChangedAt' | opsText }}</dt><dd>{{ time(c.changedAt) }} UTC</dd></dl>}@else{<p>{{ 'NotRecorded' | opsText }}</p>}</section>
<section class="panel"><h2>{{ 'Worker' | opsText }}</h2>@if(d.worker;as c){<p><app-ops-badge [value]="c.enabled?'Enabled':'Disabled'" /></p><p>{{ 'Revision' | opsText }} {{ c.revision }}</p><p class="muted">{{ 'WorkerTimestampHelp' | opsText }}</p>}@else{<p>{{ 'NotRecorded' | opsText }}</p>}<a mat-stroked-button routerLink="/admin/fulfillment">{{ 'ManageWorker' | opsText }}</a></section></div><div class="links"><a routerLink="/admin/operations/audit">{{ 'ViewHistory' | opsText }}</a></div><p class="muted">{{ 'Snapshot' | opsText }}: {{ time(d.asOf) }} UTC</p>}</section>`,styleUrls:['./operations.scss']})
export class OperationsControlsComponent extends OperationsDisplay implements OnInit {
  private service=inject(OperationsService);private destroy=inject(DestroyRef);private reload$=new BehaviorSubject(0);
  readonly data=signal<ControlsStatus|null>(null);readonly loading=signal(true);readonly error=signal('');
  ngOnInit(){this.reload$.pipe(tap(()=>{this.loading.set(true);this.error.set('');}),switchMap(()=>this.service.controls().pipe(map(data=>({data,error:''})),catchError(e=>of({data:null,error:this.failure(e.status)})))),takeUntilDestroyed(this.destroy)).subscribe(x=>{this.loading.set(false);this.data.set(x.data);this.error.set(x.error);});}
  refresh(){this.reload$.next(this.reload$.value+1);}
}
