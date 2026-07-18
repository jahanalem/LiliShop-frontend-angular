import { Routes } from '@angular/router';
import { AttributesComponent } from './attributes.component';
import { EditAttributeComponent } from './edit-attribute/edit-attribute.component';

export const ATTRIBUTES_ROUTES: Routes = [
  { path: '', component: AttributesComponent },
  { path: 'edit/:id', component: EditAttributeComponent }
];
