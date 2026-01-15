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
  templateUrl: './feedback-summary.component.html',
  styleUrls: ['./feedback-summary.component.scss']
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
