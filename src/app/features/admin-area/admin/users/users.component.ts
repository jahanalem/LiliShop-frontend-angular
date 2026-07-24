import { FormatValuePipe } from 'src/app/shared/pipes/format-value.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';

import { RouterModule } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSort, Sort } from '@angular/material/sort';

import { UserQueryParams } from './../../../../shared/models/userQueryParams';
import { AccountService } from 'src/app/core/services/account.service';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { UserPagination } from 'src/app/shared/models/pagination';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

enum ColumnNames {
  Id             = 'id',
  Email          = 'email',
  DisplayName    = 'displayName',
  RoleName       = 'roleName',
  EmailConfirmed = 'emailConfirmed',
  Action         = 'Action'
}

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe,RouterModule, FormatValuePipe, MatFormFieldModule, MatPaginatorModule, MatButtonModule, MatInputModule, MatTableModule, MatIconModule, MatSortModule]
})
export class UsersComponent implements AfterViewInit, OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  paginator = viewChild<MatPaginator>(MatPaginator);
  sort      = viewChild<MatSort>(MatSort);

  users           = signal<IAdminAreaUser[]>([]);
  totalCount      = signal<number>(0);
  userQueryParams = signal<UserQueryParams>({} as UserQueryParams);

  columnsToDisplay: ColumnNames[] = [
    ColumnNames.Id,
    ColumnNames.Email,
    ColumnNames.DisplayName,
    ColumnNames.RoleName,
    ColumnNames.EmailConfirmed,
    ColumnNames.Action
  ];

  // Values are translation keys; the template renders them through the translate pipe.
  columnFriendlyNames: { [key in ColumnNames]: string } = {
    [ColumnNames.Id]            : TranslationKeys.Admin.Common.Id,
    [ColumnNames.Email]         : TranslationKeys.Auth.EmailLabel,
    [ColumnNames.DisplayName]   : TranslationKeys.Admin.Common.Name,
    [ColumnNames.RoleName]      : TranslationKeys.Admin.Users.Role,
    [ColumnNames.EmailConfirmed]: TranslationKeys.Admin.Users.EmailConfirmed,
    [ColumnNames.Action]        : TranslationKeys.Admin.Common.Actions
  };

  private unsubscribe$ = new Subject<void>();

  private accountService = inject(AccountService);
  private router        = inject(Router);
  private deleteService = inject(DeleteService);
  private searchService = inject(SearchService<IAdminAreaUser>);

  constructor() {
    this.userQueryParams.set(this.accountService.resetUserQueryParams());
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.searchService.handleSearch(() => this.accountService.getUsers()).pipe(takeUntil(this.unsubscribe$))
      .subscribe(response => this.updateData(response));
  }

  ngAfterViewInit() {
    this.loadData();
    if (this.paginator()) {
      this.paginator()?.page?.pipe(takeUntil(this.unsubscribe$))
        .subscribe((pageEvent: PageEvent) => {
          let params = this.userQueryParams();
          params.pageNumber = pageEvent.pageIndex + 1;
          params.pageSize = pageEvent.pageSize;
          this.userQueryParams.set(params);
          this.accountService.setUserQueryParams(this.userQueryParams());

          this.loadData();
        });

      if (this.sort()) {
        this.sort()?.sortChange?.pipe(takeUntil(this.unsubscribe$)).subscribe((sortEvent: Sort) => {
          let params = this.userQueryParams();
          params.sort = sortEvent.active;
          params.sortDirection = sortEvent.direction;
          this.userQueryParams.set(params);
          this.accountService.setUserQueryParams(this.userQueryParams());

          this.loadData();
        })
      }
    }
  }

  loadData() {
    this.accountService.getUsers().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (response) => {
        if (response) {
          this.updateData(response);
        }
      }
    });
  }

  updateData(userPagination: UserPagination) {
    const users = userPagination?.data ?? [];
    this.users.set(users);
    const totalCount = userPagination?.count ?? 0;
    this.totalCount.set(totalCount);
  }

  getFriendlyName(column: ColumnNames): string {
    return this.columnFriendlyNames[column] || column;
  }


  editUser(id: number) {
    this.router.navigateByUrl(`/admin/users/edit/${id}`);
  }

  createUser() {
    window.open(`/account/register`, "_blank");
  }

  deleteUser(userId: number) {
    this.deleteService.deleteObject(
      userId,
      () => this.accountService.delete(userId),
      () => this.loadData());
  }

  applyFilter(filterValueEvent: Event) {
    this.searchService.applyFilter(filterValueEvent, this.paginator()!, this.userQueryParams());
  }
}
