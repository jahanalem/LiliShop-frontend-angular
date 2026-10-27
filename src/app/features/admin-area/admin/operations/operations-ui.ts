import { ChangeDetectionStrategy, Component, inject, Input, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

import { DatePipe } from '@angular/common';

import { ClipboardModule } from '@angular/cdk/clipboard';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { TranslationService } from 'src/app/core/i18n/translation.service';

import { operationsText } from 'src/app/core/i18n/operations-text';

import { formatMoney } from 'src/app/shared/currency';

import { SavedLine } from 'src/app/shared/models/operations';



@Pipe({name:'opsText', standalone:true, pure:false})

export class OperationsTextPipe implements PipeTransform {

  private translation = inject(TranslationService);

  transform(key: string): string { return operationsText(this.translation, key); }

}

export class OperationsDisplay {

  private translation = inject(TranslationService);

  private locale = inject(LOCALE_ID);

  t(key: string): string { return operationsText(this.translation,key); }

  money(value: number|null|undefined, currency: string|null): string { return formatMoney(value,currency,this.locale) ?? this.t('Unavailable'); }

  minor(value: number|null|undefined, currency: string|null): string {

    return value == null ? this.t('Unavailable') : `${new Intl.NumberFormat(this.locale).format(value)} ${this.t('MinorUnits')} · ${currency?.toUpperCase() ?? this.t('Unavailable')}`;

  }

  time(value: string|null|undefined): string { return value ? new DatePipe(this.locale).transform(value,'medium','UTC') ?? this.t('Unavailable') : this.t('NotRecorded'); }

  failure(status: number): string { return status === 401 || status === 403 ? 'Forbidden' : status === 404 ? 'MissingRecord' : status === 422 || status === 400 ? 'InvalidFilters' : 'Temporary'; }

}

@Component({selector:'app-ops-badge',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[OperationsTextPipe],

  template:'<span class="badge" [class.good]="good" [class.attention]="attention">{{ value | opsText }}</span>',

  styles:[`:host{display:inline-block}.badge{display:inline-flex;align-items:center;padding:.3rem .65rem;border:1px solid var(--ls-border);border-radius:999px;font-size:.78rem;font-weight:600;line-height:1.4;background:var(--ls-surface-2);color:var(--ls-text);white-space:normal}.good{border-color:#619579;background:light-dark(#edf8f1,#173c28);color:light-dark(#235b3c,#bde9ca)}.attention{border-color:#bf9659;background:light-dark(#fff5e5,#46331c);color:light-dark(#815513,#ffe0aa)}`]})

export class OperationsBadgeComponent {

  @Input() value = 'NotRecorded';

  get good() { return ['PaymentVerified','Complete','Completed','Accepted','Captured','RecoveredFromInvoice','Matched','Done'].includes(this.value); }

  get attention() { return ['Review','ReviewRequired','UnknownDelivery','LeaseExpired','Expired','Cancelled','Unresolved','Unavailable','Conflict'].includes(this.value); }

}

@Component({selector:'app-ops-id',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[ClipboardModule,MatButtonModule,MatIconModule,OperationsTextPipe],

  template:`@if(value !== null && value !== undefined) { <span class="identifier"><bdi>{{ value }}</bdi><button mat-icon-button type="button" [cdkCopyToClipboard]="text" [attr.aria-label]="('Copy' | opsText) + ': ' + text"><mat-icon>content_copy</mat-icon></button></span> } @else { <span>{{ 'NotRecorded' | opsText }}</span> }`,

  styles:[`.identifier{display:inline-flex;align-items:center;gap:.25rem;max-width:100%}bdi{font: .82rem ui-monospace,monospace;overflow-wrap:anywhere;direction:ltr}button{flex-shrink:0;--mdc-icon-button-state-layer-size:32px;width:32px;height:32px;padding:4px}mat-icon{font-size:16px;width:16px;height:16px}`]})

export class OperationsIdComponent { @Input() value: string|number|null|undefined = null; get text() { return String(this.value ?? ''); } }

@Component({selector:'app-ops-nav',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[RouterLink,RouterLinkActive,OperationsTextPipe],

  template:`<nav class="tabs" [attr.aria-label]="'Title' | opsText">@for(tab of tabs;track tab.key){<a [routerLink]="tab.path" routerLinkActive="selected">{{ tab.key | opsText }}</a>}</nav>`,

  styles:[`.tabs{display:flex;gap:.25rem;border-bottom:1px solid var(--ls-border);overflow-x:auto;margin:1.5rem 0}.tabs a{color:var(--ls-text-soft);text-decoration:none;padding:.85rem 1rem;white-space:nowrap;border-bottom:3px solid transparent;font-weight:550;font-size:.9rem}.tabs a.selected{color:var(--ls-brand-text);border-color:var(--ls-brand)}a:focus-visible{outline:2px solid var(--ls-brand);outline-offset:-3px}`]})

export class OperationsNavComponent {

  tabs = [{key:'checkouts',path:'/admin/operations/checkouts'},{key:'inbox',path:'/admin/operations/inbox'},{key:'processing',path:'/admin/fulfillment'},{key:'mail',path:'/admin/operations/mail'},{key:'controls',path:'/admin/operations/controls'},{key:'audit',path:'/admin/operations/audit'}];

}

@Component({selector:'app-ops-lines',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[RouterLink,OperationsTextPipe,OperationsBadgeComponent],template:`

  <div class="table-scroll"><table class="purchased-lines"><thead><tr><th scope="col">{{ 'Product' | opsText }}</th><th scope="col">{{ 'Quantity' | opsText }}</th><th scope="col">{{ 'UnitPrice' | opsText }}</th><th scope="col">{{ 'LineState' | opsText }}</th><th scope="col">{{ 'Reservation' | opsText }}</th><th scope="col">{{ 'Deduction' | opsText }}</th><th scope="col">{{ 'CompletedAt' | opsText }} · UTC</th></tr></thead>

  <tbody>@for(line of lines;track line.orderItemId){<tr><td><a [routerLink]="['/admin/products/edit',line.productId]">{{ line.name }}</a><small>{{ 'Line' | opsText }} {{ line.orderItemId }} · {{ line.sku ?? ('Unavailable' | opsText) }}</small><small>{{ 'Variant' | opsText }} {{ line.productVariantId ?? ('Unavailable' | opsText) }}</small></td><td>{{ line.quantity }}</td><td><bdi>{{ money(line.unitPrice,currency) }}</bdi></td><td><app-ops-badge [value]="line.evidenceState==='Conflict' ? 'Conflict' : line.completed ? 'Done' : 'Remaining'" /></td><td>{{ line.reservationId ?? ('NotRecorded' | opsText) }}</td><td>{{ line.deductionId ?? ('NotRecorded' | opsText) }}</td><td>{{ time(line.completedAt) }}</td></tr>}</tbody></table></div><p class="muted">{{ 'StockHelp' | opsText }}</p>`,styleUrls:['./operations.scss']})

export class OperationsLinesComponent extends OperationsDisplay { @Input() lines: SavedLine[] = []; @Input() currency: string|null = null; }

