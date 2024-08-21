import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { FileUploadModule } from 'ng2-file-upload';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { RouterModule } from '@angular/router';

import { BreadcrumbComponent, BreadcrumbItemDirective, BreadcrumbService } from 'xng-breadcrumb';

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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { PagingHeaderComponent } from './components/paging-header/paging-header.component';
import { PagerComponent } from './components/pager/pager.component';
import { OrderTotalsComponent } from './components/order-totals/order-totals.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { BasketSummaryComponent } from './components/basket-summary/basket-summary.component';
import { TextTextareaComponent } from './components/text-textarea/text-textarea.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { PhotoEditorComponent } from './components/photo-editor/photo-editor.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { SectionHeaderComponent } from './components/section-header/section-header.component';
import { FooterComponent } from './components/footer/footer.component';

import { CheckPolicyDirective } from './directives/check-policy.directive';
import { FormatValuePipe } from './pipes/format-value.pipe';

import { CloudinaryModule } from '@cloudinary/ng';

const components = [
  NavBarComponent,
  FooterComponent,
  SectionHeaderComponent,
  PagingHeaderComponent,
  PagerComponent,
  OrderTotalsComponent,
  TextInputComponent,
  BasketSummaryComponent,
  TextTextareaComponent,
  DialogComponent,
  PhotoEditorComponent,
  ConfirmationDialogComponent,
];

const matModules = [
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
  MatPaginatorModule,
  MatCardModule,
  MatProgressBarModule,
  MatTableModule
];

const thirdPartyModules = [
  CloudinaryModule,
  FileUploadModule,
  BreadcrumbComponent,
  BreadcrumbItemDirective
]

@NgModule({
  declarations: [
    ...components,
    FormatValuePipe,
    CheckPolicyDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CdkStepperModule,
    RouterModule,
    NgOptimizedImage,
    ...thirdPartyModules,
    ...matModules,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    CdkStepperModule,
    FileUploadModule,
    FormatValuePipe,
    CheckPolicyDirective,
    ...components,
    ...thirdPartyModules,
    ...matModules,
  ],
  providers: [
    BreadcrumbService,
    DatePipe,
  ]
})
export class SharedModule { }
