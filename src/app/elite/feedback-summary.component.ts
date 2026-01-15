import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EliteService } from '../shared/services/elite.service';
import { FeedbackSummary, FeedbackIssue, ProblematicSubreddit, AIRecommendation } from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-feedback-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule
  ],
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Human Feedback Analysis</h1>
          <p class="text-gray-600 mt-1">
            Insights from your approval/rejection patterns to improve AI responses
          </p>
        </div>
        <button mat-stroked-button (click)="loadSummary()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading && summary">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Total Approvals</div>
            <div class="text-2xl font-bold text-green-600">{{ summary.total_approvals | number }}</div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Total Rejections</div>
            <div class="text-2xl font-bold text-red-600">{{ summary.total_rejections | number }}</div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Approval Rate</div>
            <div class="text-2xl font-bold" [ngClass]="getApprovalRateClass()">
              {{ summary.approval_rate * 100 | number:'1.1-1' }}%
            </div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Top Issues</div>
            <div class="text-2xl font-bold text-orange-600">{{ summary.top_issues.length }}</div>
          </mat-card>
        </div>

        <!-- Approval Rate Progress -->
        <mat-card class="mb-6 p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Overall Approval Rate</h3>
          <div class="flex items-center gap-4">
            <mat-progress-bar mode="determinate"
                             [value]="summary.approval_rate * 100"
                             [color]="summary.approval_rate >= 0.7 ? 'primary' : 'warn'"
                             class="flex-1 h-3">
            </mat-progress-bar>
            <span class="text-lg font-bold" [ngClass]="getApprovalRateClass()">
              {{ summary.approval_rate * 100 | number:'1.1-1' }}%
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Target: 70%+ approval rate indicates well-tuned AI responses
          </p>
        </mat-card>

        <!-- AI Recommendations -->
        <mat-card class="mb-6" *ngIf="summary.recommendations.length > 0">
          <mat-card-header class="bg-purple-50 -mx-4 -mt-4 px-4 py-3 mb-4">
            <mat-icon class="text-purple-500 mr-2">auto_awesome</mat-icon>
            <mat-card-title class="text-lg">AI Recommendations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-4">
              <div *ngFor="let rec of summary.recommendations"
                   class="border rounded-lg p-4"
                   [ngClass]="getRecommendationBorderClass(rec.priority)">
                <div class="flex items-start gap-3">
                  <mat-icon [ngClass]="getRecommendationIconClass(rec.priority)">
                    {{ getRecommendationIcon(rec.type) }}
                  </mat-icon>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-medium text-gray-800">{{ rec.title }}</h4>
                      <span class="px-2 py-0.5 rounded text-xs font-medium"
                            [ngClass]="getRecommendationBadgeClass(rec.priority)">
                        {{ rec.priority | titlecase }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">{{ rec.rationale }}</p>
                    <div class="bg-gray-50 rounded p-2">
                      <span class="text-xs text-gray-500">Suggested Action:</span>
                      <p class="text-sm font-medium text-gray-700">{{ rec.action }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Top Issues -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Top Rejection Reasons</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div *ngIf="summary.top_issues.length === 0" class="text-center py-8 text-gray-500">
              <mat-icon class="text-4xl text-gray-300">sentiment_satisfied</mat-icon>
              <p class="mt-2">No significant issues detected</p>
            </div>

            <div *ngIf="summary.top_issues.length > 0" class="space-y-4">
              <div *ngFor="let issue of summary.top_issues; let i = index" class="flex items-center gap-4">
                <span class="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                  {{ i + 1 }}
                </span>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-gray-800">
                      {{ eliteService.getRejectionReasonLabel(issue.reason) }}
                    </span>
                    <span class="text-sm text-gray-600">
                      {{ issue.count }} ({{ issue.percentage | number:'1.0-0' }}%)
                    </span>
                  </div>
                  <mat-progress-bar mode="determinate"
                                   [value]="issue.percentage"
                                   color="warn"
                                   class="h-2">
                  </mat-progress-bar>
                  <p class="text-xs text-gray-500 mt-1">{{ issue.description }}</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Rejection Breakdown -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Full Rejection Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div *ngFor="let item of getRejectionBreakdownItems()"
                   class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ item.count }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ item.label }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Problematic Subreddits -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Problematic Subreddits</mat-card-title>
            <mat-card-subtitle>Subreddits with high rejection rates</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div *ngIf="summary.problematic_subreddits.length === 0" class="text-center py-8 text-gray-500">
              <mat-icon class="text-4xl text-gray-300">check_circle</mat-icon>
              <p class="mt-2">No problematic subreddits detected</p>
            </div>

            <div *ngIf="summary.problematic_subreddits.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-left text-sm text-gray-500 border-b">
                    <th class="pb-2">Subreddit</th>
                    <th class="pb-2 text-right">Rejection Rate</th>
                    <th class="pb-2 text-right">Total Rejections</th>
                    <th class="pb-2">Top Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sub of summary.problematic_subreddits" class="border-b last:border-0">
                    <td class="py-3">
                      <span class="font-medium">r/{{ sub.subreddit }}</span>
                    </td>
                    <td class="py-3 text-right">
                      <span class="px-2 py-1 rounded text-sm"
                            [ngClass]="getRejectionRateClass(sub.rejection_rate)">
                        {{ sub.rejection_rate * 100 | number:'1.0-0' }}%
                      </span>
                    </td>
                    <td class="py-3 text-right text-gray-600">{{ sub.total_rejections }}</td>
                    <td class="py-3">
                      <span *ngIf="sub.top_reason" class="text-sm text-gray-600">
                        {{ eliteService.getRejectionReasonLabel(sub.top_reason) }}
                      </span>
                      <span *ngIf="!sub.top_reason" class="text-gray-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Problematic Strategies -->
        <mat-card class="mb-6" *ngIf="summary.problematic_strategies.length > 0">
          <mat-card-header>
            <mat-card-title>Response Strategies Performance</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let strat of summary.problematic_strategies"
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-700">
                  {{ eliteService.getStrategyLabel(strat.strategy) }}
                </span>
                <span class="text-red-600">{{ strat.rejections }} rejections</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Last Analysis -->
        <div class="text-center text-sm text-gray-500" *ngIf="summary.last_analysis_at">
          Last analyzed: {{ summary.last_analysis_at | date:'medium' }}
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !summary" class="text-center py-12">
        <mat-icon class="text-6xl text-gray-300">analytics</mat-icon>
        <p class="text-gray-500 mt-4">No feedback data available yet</p>
        <p class="text-gray-400 text-sm">Start approving and rejecting responses to build up feedback patterns</p>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-progress-bar .mdc-linear-progress__bar-inner {
      border-radius: 4px;
    }
  `]
})
export class FeedbackSummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  summary: FeedbackSummary | null = null;
  isLoading = true;

  constructor(public eliteService: EliteService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSummary(): void {
    this.isLoading = true;
    this.eliteService.getFeedbackSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.isLoading = false;
        },
        error: () => {
          this.summary = null;
          this.isLoading = false;
        }
      });
  }

  getApprovalRateClass(): string {
    if (!this.summary) return 'text-gray-600';
    if (this.summary.approval_rate >= 0.8) return 'text-green-600';
    if (this.summary.approval_rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getRejectionRateClass(rate: number): string {
    if (rate >= 0.5) return 'bg-red-100 text-red-800';
    if (rate >= 0.3) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  getRecommendationBorderClass(priority: string): string {
    const classes: Record<string, string> = {
      'high': 'border-red-200 bg-red-50',
      'medium': 'border-orange-200 bg-orange-50',
      'low': 'border-blue-200 bg-blue-50'
    };
    return classes[priority] || 'border-gray-200';
  }

  getRecommendationIconClass(priority: string): string {
    const classes: Record<string, string> = {
      'high': 'text-red-500',
      'medium': 'text-orange-500',
      'low': 'text-blue-500'
    };
    return classes[priority] || 'text-gray-500';
  }

  getRecommendationBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-orange-100 text-orange-800',
      'low': 'bg-blue-100 text-blue-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getRecommendationIcon(type: string): string {
    const icons: Record<string, string> = {
      'subreddit_config': 'tune',
      'strategy_adjustment': 'alt_route',
      'tone_adjustment': 'record_voice_over',
      'content_quality': 'article',
      'timing': 'schedule',
      'general': 'lightbulb'
    };
    return icons[type] || 'lightbulb';
  }

  getRejectionBreakdownItems(): { reason: string; label: string; count: number }[] {
    if (!this.summary) return [];
    return Object.entries(this.summary.rejection_breakdown)
      .map(([reason, count]) => ({
        reason,
        label: this.eliteService.getRejectionReasonLabel(reason as any),
        count
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }
}
