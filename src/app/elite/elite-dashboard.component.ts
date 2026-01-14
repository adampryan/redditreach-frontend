import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { EliteService } from '../shared/services/elite.service';
import {
  AIInsight,
  AIInsightStats,
  EliteDashboardData,
  ConversionPattern,
  InsightType
} from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-elite-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './elite-dashboard.component.html',
  styleUrl: './elite-dashboard.component.scss'
})
export class EliteDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  dashboardData: EliteDashboardData | null = null;
  insightStats: AIInsightStats | null = null;
  pendingInsights: AIInsight[] = [];
  patterns: ConversionPattern[] = [];

  // Chart data
  intentChartData: { label: string; count: number; color: string }[] = [];

  constructor(public eliteService: EliteService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;

    forkJoin({
      dashboard: this.eliteService.getEliteDashboard(),
      insightStats: this.eliteService.getInsightStats(),
      patterns: this.eliteService.getConversionPatterns()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dashboardData = result.dashboard;
          this.insightStats = result.insightStats;
          this.patterns = result.patterns.patterns;
          this.buildChartData();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load elite dashboard:', err);
          this.loading = false;
        }
      });
  }

  buildChartData(): void {
    if (!this.dashboardData) return;

    const dist = this.dashboardData.intent_distribution;
    this.intentChartData = [
      { label: 'Active Seeking', count: dist['tier_1'] || 0, color: '#10B981' },
      { label: 'Pain Expression', count: dist['tier_2'] || 0, color: '#3B82F6' },
      { label: 'Implicit Need', count: dist['tier_3'] || 0, color: '#F59E0B' },
      { label: 'Engagement Only', count: dist['tier_4'] || 0, color: '#6B7280' }
    ];
  }

  getIntentTotal(): number {
    return this.intentChartData.reduce((sum, item) => sum + item.count, 0);
  }

  getIntentPercentage(count: number): number {
    const total = this.getIntentTotal();
    return total > 0 ? (count / total) * 100 : 0;
  }

  dismissInsight(insightId: string): void {
    this.eliteService.dismissInsight(insightId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDashboard();
        }
      });
  }

  getInsightIcon(type: InsightType): string {
    return this.eliteService.getInsightTypeIcon(type);
  }

  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }
}
