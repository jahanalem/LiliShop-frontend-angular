import { FormatValuePipe } from 'src/app/shared/pipes/format-value.pipe';
import { CheckPolicyDirective } from 'src/app/shared/directives/check-policy.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, inject, signal, OnInit, viewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { merge, Subject, takeUntil } from 'rxjs';
import { ContactService } from 'src/app/core/services/contact.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { IContactUsMessage } from 'src/app/shared/models/contactUsMessage';
import { ContactUsMessageQueryParams } from 'src/app/shared/models/contactUsMessageQueryParams';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { PolicyNames } from 'src/app/shared/models/policy';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-contact-us-messages',
  standalone: true,
  templateUrl: './contact-us-messages.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './contact-us-messages.component.scss',
  imports: [
    TranslatePipe,CommonModule, RouterModule, FormatValuePipe, CheckPolicyDirective, MatFormFieldModule, MatPaginatorModule, MatButtonModule, MatInputModule, MatTableModule, MatIconModule, MatSortModule]
})
export class ContactUsMessagesComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort      = viewChild.required<MatSort>(MatSort);

  policyNames   = PolicyNames;
  messageParams = signal<ContactUsMessageQueryParams>({} as ContactUsMessageQueryParams);
  messages      = signal<IContactUsMessage[]>([]);
  totalCount    = signal<number>(0);

  columnsToDisplay: string[] = ['id', 'email', 'firstName', 'lastName', 'message', 'createdDate', 'Action'];

  private contactService = inject(ContactService);
  private deleteService  = inject(DeleteService);
  private searchService  = inject(SearchService);

  private router = inject(Router);

  destroy$ = new Subject<void>();

  messageColumnStyles = {
    'text-overflow': 'ellipsis',
    'overflow': 'hidden',
    'width': '350px',
    'white-space': 'nowrap',
    'max-width': '350px'
  };

  constructor() {
    this.messageParams.set(new ContactUsMessageQueryParams());
  }

  ngOnInit() {
    this.searchService.handleSearch(() => this.contactService.getPaginatedMessages())
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => this.updateMessages(response));
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort().sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => (this.paginator().pageIndex = 0));
    this.getPaginatedMessages();

    merge(this.sort().sortChange, this.paginator().page)
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: Sort | PageEvent) => {

        const sortEvent = x as Sort;
        if ((x as PageEvent).pageSize) {
          const pageEvent = x as PageEvent;
          this.messageParams.update(params => ({
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));
        }
        if (sortEvent) {
          this.messageParams.update(params => ({
            ...params,
            sort: this.sort().active,
            sortDirection: this.sort().direction
          }));
        }
        this.getPaginatedMessages();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMessages(response: PaginationWithData<IContactUsMessage>): void {
    this.messages.update(() => (response.data));
    this.totalCount.update(() => (response.count));
  }

  getPaginatedMessages() {
    this.contactService.messageParams = this.messageParams();
    this.contactService.getPaginatedMessages().subscribe(
      {
        next: (response) => {
          this.updateMessages(response)
        },
        error: (err) => {
          console.log(err);
        }
      });
  }

  editMessage(id: number) {
    this.router.navigateByUrl(`/admin/contact-us-messages/edit/${id}`);
  }

  deleteMessage(id: number) {
    this.deleteService.deleteObject(
      id,
      () => this.contactService.deleteMessage(id),
      () => this.getPaginatedMessages());
  }

  applyFilter(filterValueEvent: Event) {
    this.searchService.applyFilter(filterValueEvent, this.paginator(), this.messageParams());
  }

  /** Maps a raw column id onto its translation key for the header row. */
  protected columnLabel(column: string): string {
    const labels: Record<string, string> = {
      id: TranslationKeys.Admin.Common.Id,
      name: TranslationKeys.Admin.Common.Name,
      isActive: TranslationKeys.Admin.Common.Active,
      email: TranslationKeys.Auth.EmailLabel,
      firstName: TranslationKeys.Checkout.FirstName,
      lastName: TranslationKeys.Checkout.LastName,
      message: TranslationKeys.Contact.Message,
      createdDate: TranslationKeys.Admin.Messages.CreatedDate,
      Action: TranslationKeys.Admin.Common.Actions
    };
    return labels[column] ?? column;
  }
}