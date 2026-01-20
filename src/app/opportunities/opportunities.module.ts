import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { OpportunitiesListComponent } from './opportunities-list.component';
import { OpportunityDetailComponent } from './opportunity-detail.component';
import { RegenerateDialogComponent } from './regenerate-dialog.component';
import { BulkApproveDialogComponent } from './bulk-approve-dialog.component';
// Phase 5: Structured Rejection Feedback
import { RejectOpportunityDialogComponent } from '../elite/reject-opportunity-dialog.component';

const routes: Routes = [
  { path: '', component: OpportunitiesListComponent },
  { path: ':id', component: OpportunityDetailComponent }
];

@NgModule({
  declarations: [
    OpportunitiesListComponent,
    OpportunityDetailComponent,
    RegenerateDialogComponent,
    BulkApproveDialogComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    // Standalone component for Phase 5 rejection dialog
    RejectOpportunityDialogComponent
  ]
})
export class OpportunitiesModule { }
