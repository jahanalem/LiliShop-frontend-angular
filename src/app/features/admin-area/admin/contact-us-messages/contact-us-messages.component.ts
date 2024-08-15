import { Component, inject, signal, OnInit, viewChild, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-contact-us-messages',
  standalone: false,
  templateUrl: './contact-us-messages.component.html',
  styleUrl: './contact-us-messages.component.scss'
})
export class ContactUsMessagesComponent implements OnInit, OnDestroy {
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
}
