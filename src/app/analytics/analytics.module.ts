import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { AnalyticsComponent } from './analytics.component';

const routes: Routes = [
  { path: '', component: AnalyticsComponent }
];

@NgModule({
  declarations: [
    AnalyticsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AnalyticsModule { }
