import { Routes } from '@angular/router';
import { OperationsListComponent } from './operations-list.component';
import { OperationsDetailComponent } from './operations-detail.component';
import { OperationsControlsComponent } from './operations-controls.component';

export const OPERATIONS_ROUTES: Routes = [
  {path:'',pathMatch:'full',redirectTo:'checkouts'},
  {path:'controls',component:OperationsControlsComponent},
  {path:'audit',component:OperationsListComponent,data:{kind:'audit'}},
  {path:'orders/:id',component:OperationsDetailComponent,data:{kind:'orders'}},
  ...['checkouts','inbox','mail'].flatMap(kind=>[
    {path:kind,component:OperationsListComponent,data:{kind}},
    {path:`${kind}/:id`,component:OperationsDetailComponent,data:{kind}},
  ]),
];
