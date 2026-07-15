
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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Observable } from 'rxjs';
import { BreadcrumbService, BreadcrumbComponent, BreadcrumbItemDirective } from 'xng-breadcrumb';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
    selector: 'app-section-header',
    templateUrl: './section-header.component.html',
    styleUrls: ['./section-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    CommonModule, RouterModule,
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
    MatTableModule,
    BreadcrumbComponent,
    BreadcrumbItemDirective,
    TranslatePipe
  ]

})
export class SectionHeaderComponent {
  breadcrumb$: Observable<any[]>;

  private bcService = inject(BreadcrumbService);

  constructor() {
    this.breadcrumb$ = this.bcService.breadcrumbs$;
  }
}
