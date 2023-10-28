import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UserQueryParams } from './../../../../shared/models/userQueryParams';
import { AccountService } from 'src/app/core/services/account.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { MatSort, Sort } from '@angular/material/sort';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';

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
export class UsersComponent implements AfterViewInit {
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
    private accountService: AccountService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private storageService: StorageService,
    private deleteService: DeleteService) {
  }

  ngOnDestroy() {
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.loadData();

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
      console.log(`sort  = ${this.userQueryParams.sort},  value = ${this.userQueryParams.sortDirection}`);
      this.accountService.setUserQueryParams(this.userQueryParams);

      this.loadData();
    })
  }

  loadData() {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return;
    }
    this.accountService.getUsers(token).subscribe((response) => {
      this.users = response?.data ?? [];
      this.totalCount = response?.count ?? 0;
      this.changeDetectorRef.detectChanges();
    });
  }

  getFriendlyName(column: ColumnNames): string {
    return this.columnFriendlyNames[column] || column;
  }


  //TODO: Implement this method
  editUser(id: number) {
    this.router.navigateByUrl(`/admin/users/edit/${id}`);
  }

  //TODO: Implement this method
  createUser() {
    this.router.navigateByUrl(`/admin/users/edit/${-1}`);
  }

  deleteUser(userId: number) {
    this.deleteService.deleteObject(
      userId,
      () => this.accountService.delete(userId),
      () => this.loadData);
  }
}
