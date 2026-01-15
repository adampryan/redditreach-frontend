import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EliteDashboardComponent } from './elite-dashboard.component';
import { AiInsightsListComponent } from './ai-insights-list.component';
import { AiInsightDetailComponent } from './ai-insight-detail.component';
// Phase 5: Human-AI Collaboration & A/B Testing
import { ABTestsComponent } from './ab-tests.component';
import { ABTestDetailComponent } from './ab-test-detail.component';
import { FeedbackSummaryComponent } from './feedback-summary.component';
import { TonePerformanceComponent } from './tone-performance.component';

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
  },
  // Phase 5: A/B Testing
  {
    path: 'ab-tests',
    component: ABTestsComponent
  },
  {
    path: 'ab-tests/:id',
    component: ABTestDetailComponent
  },
  // Phase 5: Human Feedback Analysis
  {
    path: 'feedback',
    component: FeedbackSummaryComponent
  },
  // Phase 5: Tone Performance
  {
    path: 'tone-performance',
    component: TonePerformanceComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EliteDashboardComponent,
    AiInsightsListComponent,
    AiInsightDetailComponent,
    // Phase 5 Components
    ABTestsComponent,
    ABTestDetailComponent,
    FeedbackSummaryComponent,
    TonePerformanceComponent
  ]
})
export class EliteModule { }
