import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EliteDashboardComponent } from './elite-dashboard.component';
import { AiInsightsListComponent } from './ai-insights-list.component';
import { AiInsightDetailComponent } from './ai-insight-detail.component';

const routes: Routes = [
  {
    path: '',
    component: EliteDashboardComponent
  },
  {
    path: 'insights',
    component: AiInsightsListComponent
  },
  {
    path: 'insights/:id',
    component: AiInsightDetailComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EliteDashboardComponent,
    AiInsightsListComponent,
    AiInsightDetailComponent
  ]
})
export class EliteModule { }
