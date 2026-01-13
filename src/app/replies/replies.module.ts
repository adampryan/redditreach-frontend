import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { RepliesListComponent } from './replies-list.component';
import { ReplyDetailComponent } from './reply-detail.component';
import { GenerateReplyDialogComponent } from './generate-reply-dialog.component';

const routes: Routes = [
  { path: '', component: RepliesListComponent },
  { path: ':id', component: ReplyDetailComponent }
];

@NgModule({
  declarations: [
    RepliesListComponent,
    ReplyDetailComponent,
    GenerateReplyDialogComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class RepliesModule { }
