import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { OpportunitiesListComponent } from './opportunities-list.component';
import { OpportunityDetailComponent } from './opportunity-detail.component';
import { RegenerateDialogComponent } from './regenerate-dialog.component';

const routes: Routes = [
  { path: '', component: OpportunitiesListComponent },
  { path: ':id', component: OpportunityDetailComponent }
];

@NgModule({
  declarations: [
    OpportunitiesListComponent,
    OpportunityDetailComponent,
    RegenerateDialogComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class OpportunitiesModule { }
