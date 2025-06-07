import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { FileUploadModule } from 'ng2-file-upload';
import { RouterModule } from '@angular/router';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CloudinaryModule } from '@cloudinary/ng';

import { BreadcrumbComponent, BreadcrumbItemDirective, BreadcrumbService } from 'xng-breadcrumb';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { BasketSummaryComponent } from './components/basket-summary/basket-summary.component';
import { SectionHeaderComponent } from './components/section-header/section-header.component';
import { PagingHeaderComponent } from './components/paging-header/paging-header.component';
import { TextTextareaComponent } from './components/text-textarea/text-textarea.component';
import { OrderTotalsComponent } from './components/order-totals/order-totals.component';
import { PhotoEditorComponent } from './components/photo-editor/photo-editor.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { FooterComponent } from './components/footer/footer.component';
import { PagerComponent } from './components/pager/pager.component';

import { CheckPolicyDirective } from './directives/check-policy.directive';
import { FormatValuePipe } from './pipes/format-value.pipe';

import { MatSortModule } from '@angular/material/sort';

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
  MatProgressBarModule,
  MatPaginatorModule,
  MatCardModule,
  MatTableModule,
  MatSortModule
];

const thirdPartyModules = [
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
    CloudinaryModule,
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
    CloudinaryModule,
    ...components,
    ...thirdPartyModules,
    ...matModules,
  ],
  providers: [
    BreadcrumbService,
    DatePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
