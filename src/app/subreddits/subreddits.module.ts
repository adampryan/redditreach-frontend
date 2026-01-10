import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { SubredditsListComponent } from './subreddits-list.component';

const routes: Routes = [
  { path: '', component: SubredditsListComponent }
];

@NgModule({
  declarations: [
    SubredditsListComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SubredditsModule { }
