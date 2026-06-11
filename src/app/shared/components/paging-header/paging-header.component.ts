
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';

@Component({
    selector: 'app-paging-header',
    templateUrl: './paging-header.component.html',
    styleUrls: ['./paging-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatListModule,
    MatSidenavModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatCardModule,
    MatTableModule
]

})
export class PagingHeaderComponent implements OnInit {
  pageNumber = input<number>(1);
  pageSize   = input<number>(1);
  totalCount = input<number>(0);

  constructor() { }

  ngOnInit(): void {
  }

  getStartItem(): number {
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  }

  getEndItem(): number {
    return Math.min(this.pageNumber() * this.pageSize(), this.totalCount());
  }

  hasResults(): boolean {
    return this.totalCount() > 0;
  }

  noResults(): boolean {
    return this.totalCount() === 0;
  }
}
