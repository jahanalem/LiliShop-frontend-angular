import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UserQueryParams } from './../../../../shared/models/userQueryParams';
import { AccountService } from 'src/app/core/services/account.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  columnsToDisplay: string[] = ['id', 'email', 'displayName', 'roleName', 'emailConfirmed', 'phoneNumberConfirmed', 'Action'];
  users: IAdminAreaUser[] = [];
  totalCount: number = 0;
  userQueryParams: UserQueryParams = this.accountService.getUserParams();
  private unsubscribe$ = new Subject<void>();

  constructor(private accountService: AccountService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private storageService: StorageService
  ) {
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
        this.loadData();
      });
  }

  loadData() {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return;
    }
    this.accountService.getUsers(token).subscribe((response) => {
      this.users = response ? response : [];
      this.changeDetectorRef.detectChanges();
    });
  }

  //TODO: Implement this method
  editUser(id: number) {
    this.router.navigateByUrl(`/admin/users/edit/${id}`);
  }

  //TODO: Implement this method
  createUser() {
    this.router.navigateByUrl(`/admin/users/edit/${-1}`);
  }

  //TODO: Implement this method
  deleteUser(_id: number) {
    return null
  }
}
