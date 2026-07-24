import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSortHeader } from '@angular/material/sort';
import { Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from 'src/app/core/services/account.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { UserQueryParams } from 'src/app/shared/models/userQueryParams';

import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  const accountService = {
    delete: vi.fn(),
    getUsers: vi.fn(),
    resetUserQueryParams: vi.fn(),
    setUserQueryParams: vi.fn()
  };

  const searchService = {
    applyFilter: vi.fn(),
    handleSearch: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    accountService.resetUserQueryParams.mockReturnValue({} as UserQueryParams);
    accountService.getUsers.mockReturnValue(of({
      pageIndex: 1,
      pageSize: 5,
      count: 0,
      data: []
    }));
    searchService.handleSearch.mockReturnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: DeleteService, useValue: { deleteObject: vi.fn() } },
        { provide: SearchService, useValue: searchService },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a sort header for every data column before users are loaded', () => {
    const sortHeaders = fixture.debugElement
      .queryAll(By.directive(MatSortHeader))
      .map(element => element.injector.get(MatSortHeader).id);

    expect(sortHeaders).toEqual([
      'id',
      'email',
      'displayName',
      'roleName',
      'emailConfirmed'
    ]);
    expect(component.sort()?.disableClear).toBe(true);
  });

  it('requests ascending and descending sorting for every data column', () => {
    const sortableColumns = [
      'id',
      'email',
      'displayName',
      'roleName',
      'emailConfirmed'
    ];

    accountService.setUserQueryParams.mockClear();
    accountService.getUsers.mockClear();

    const sortHeaders = fixture.debugElement.queryAll(By.directive(MatSortHeader));

    for (const column of sortableColumns) {
      const header = sortHeaders.find(
        element => element.injector.get(MatSortHeader).id === column
      );

      expect(header).toBeDefined();

      for (const direction of ['asc', 'desc'] as const) {
        (header!.nativeElement as HTMLElement).click();

        expect(accountService.setUserQueryParams).toHaveBeenLastCalledWith(
          expect.objectContaining({ sort: column, sortDirection: direction })
        );
      }
    }

    expect(accountService.getUsers).toHaveBeenCalledTimes(sortableColumns.length * 2);
  });
});
