import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columnsToDisplay: ColumnNames[] = [
    ColumnNames.Id,
    ColumnNames.Email,
    ColumnNames.DisplayName,
    ColumnNames.RoleName,
    ColumnNames.EmailConfirmed,
    ColumnNames.Action
  ];

  columnFriendlyNames: { [key in ColumnNames]: string } = {
    [ColumnNames.Id]            : 'ID',
    [ColumnNames.Email]         : 'Email',
    [ColumnNames.DisplayName]   : 'Name',
    [ColumnNames.RoleName]      : 'Role',
    [ColumnNames.EmailConfirmed]: 'Email Confirmed',
    [ColumnNames.Action]        : 'Action'
  };

  users: IAdminAreaUser[] = [];
  totalCount: number = 0;
  userQueryParams: UserQueryParams = this.accountService.getUserQueryParams();

  private unsubscribe$ = new Subject<void>();

  constructor(
    private accountService   : AccountService,
    private router           : Router,
    private changeDetectorRef: ChangeDetectorRef,
    private deleteService    : DeleteService,
    private searchService    : SearchService<IAdminAreaUser>) {
  }

  ngOnDestroy() {
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.searchService.handleSearch(() => this.accountService.getUsers())
      .subscribe(response => this.updateData(response));
    this.loadData();
  }

  ngAfterViewInit() {
    if (this.paginator && this.sort) {
      this.paginator.page.pipe(takeUntil(this.unsubscribe$))
        .subscribe((pageEvent: PageEvent) => {
          this.userQueryParams.pageNumber = pageEvent.pageIndex + 1;
          this.userQueryParams.pageSize = pageEvent.pageSize;
          this.accountService.setUserQueryParams(this.userQueryParams);

          this.loadData();
        });

      this.sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe((sortEvent: Sort) => {
        this.userQueryParams.sort = sortEvent.active;
        this.userQueryParams.sortDirection = sortEvent.direction;
        this.accountService.setUserQueryParams(this.userQueryParams);

        this.loadData();
      })
    }
  }

  loadData() {
    this.accountService.getUsers().subscribe({
      next: (response) => {
        if (response) {
          this.updateData(response);
        }
      }
    });
    this.changeDetectorRef.detectChanges();
  }

  updateData(userPagination: UserPagination) {
    this.users = userPagination?.data ?? [];
    this.totalCount = userPagination?.count ?? 0;
    this.changeDetectorRef.detectChanges();
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
      () => this.loadData);
  }

  applyFilter(filterValueEvent: Event) {
    this.searchService.applyFilter(filterValueEvent, this.paginator, this.userQueryParams);
  }

  get existUser(): boolean {
    if (this.users.length > 0) {
      return true;
    }
    return false;
  }
}
