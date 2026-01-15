import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { EliteService } from '../shared/services/elite.service';
import {
  AIInsight,
  AIInsightStats,
  InsightType,
  InsightPriority,
  InsightStatus
} from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-ai-insights-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './ai-insights-list.component.html',
  styleUrls: ['./ai-insights-list.component.scss']
})
export class AiInsightsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  insights: AIInsight[] = [];
  stats: AIInsightStats | null = null;
  loading = false;
  page = 1;
  totalCount = 0;

  filters: {
    status: InsightStatus | '';
    type: InsightType | '';
    priority: InsightPriority | '';
  } = {
    status: '',
    type: '',
    priority: ''
  };

  constructor(public eliteService: EliteService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.eliteService.getInsightStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        }
      });
  }

  loadInsights(): void {
    this.page = 1;
    this.loading = true;

    const params: any = { page: this.page };
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.priority) params.priority = this.filters.priority;

    this.eliteService.getInsights(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.insights = response.results;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadMore(): void {
    this.page++;
    this.loading = true;

    const params: any = { page: this.page };
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.priority) params.priority = this.filters.priority;

    this.eliteService.getInsights(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.insights = [...this.insights, ...response.results];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  dismissInsight(event: Event, insightId: string): void {
    event.stopPropagation();
    this.eliteService.dismissInsight(insightId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.insights = this.insights.filter(i => i.id !== insightId);
          this.loadStats();
        }
      });
  }
}
