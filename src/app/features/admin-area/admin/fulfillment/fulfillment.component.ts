import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { fulfillmentText } from 'src/app/core/i18n/fulfillment-text';
import { FulfillmentDetail, FulfillmentPage, WorkerControl } from 'src/app/shared/models/fulfillment';

@Component({ selector: 'app-fulfillment', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule], templateUrl: './fulfillment.component.html' })
export class FulfillmentComponent implements OnInit {
  private service = inject(FulfillmentService);
  private translation = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  readonly list = signal<FulfillmentPage|null>(null);
  readonly detail = signal<FulfillmentDetail|null>(null);
  readonly control = signal<WorkerControl|null>(null);
  readonly busy = signal(false); readonly error = signal(false);
  readonly filters = ['', 'Pending', 'Processing', 'Retry', 'ReviewRequired', 'Complete', 'UnknownDelivery'];
  reason = ''; state = ''; page = 1; id: string|null = null;
  t(name: string): string { return fulfillmentText(this.translation, name); }
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params => { this.id = params.get('id'); this.detail.set(null); this.load(); });
    this.service.control().pipe(takeUntilDestroyed(this.destroy)).subscribe({next: x => this.control.set(x), error: () => this.error.set(true)});
  }
  load(): void {
    this.error.set(false);
    if (this.id) this.service.detail(this.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({next: x => this.detail.set(x), error: () => this.error.set(true)});
    else this.service.list(this.page, this.state).pipe(takeUntilDestroyed(this.destroy)).subscribe({next: x => this.list.set(x), error: () => this.error.set(true)});
  }
  filter(): void { this.page = 1; this.load(); }
  move(delta: number): void { this.page += delta; this.load(); }
  canRetry(state?: string): boolean { return state === 'Retry' || state === 'ReviewRequired'; }
  retry(email = false): void {
    const d = this.detail(); const work = email ? d?.email : d?.execution;
    if (!d || !work || !this.canRetry(work.state) || this.busy() || !this.reason.trim()) return;
    this.busy.set(true);
    this.service.retry(d.id, work.revision, this.reason.trim(), email).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.busy.set(false); this.reason = ''; this.load(); },
      error: () => { this.busy.set(false); this.error.set(true); }
    });
  }
  toggle(): void {
    const c = this.control(); if (!c || this.busy() || !this.reason.trim()) return;
    this.busy.set(true);
    this.service.updateControl(c.revision, !c.enabled, this.reason.trim()).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: x => { this.control.set(x); this.busy.set(false); this.reason = ''; this.load(); },
      error: () => { this.busy.set(false); this.error.set(true); }
    });
  }
}
