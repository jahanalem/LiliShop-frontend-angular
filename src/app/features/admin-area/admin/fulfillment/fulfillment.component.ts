import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OperationsListComponent } from '../operations/operations-list.component';
import { OperationsDetailComponent } from '../operations/operations-detail.component';

@Component({selector:'app-fulfillment',standalone:true,imports:[OperationsListComponent,OperationsDetailComponent],template:'@if(id) { <app-operations-detail kind="processing" /> } @else { <app-operations-list kind="processing" /> }'})
export class FulfillmentComponent { readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id'); }
