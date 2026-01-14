import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <a routerLink="/elite" class="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">
            &larr; Back to Command Center
          </a>
          <h1 class="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p class="text-gray-600">Patterns, recommendations, and questions from the AI</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div *ngIf="stats" class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <div class="text-2xl font-bold text-indigo-600">{{ stats.new }}</div>
          <div class="text-sm text-gray-500">New</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <div class="text-2xl font-bold text-orange-600">{{ stats.high_priority }}</div>
          <div class="text-sm text-gray-500">High Priority</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.pending_action }}</div>
          <div class="text-sm text-gray-500">Need Action</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <div class="text-2xl font-bold text-gray-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">Total</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select [(ngModel)]="filters.status" (change)="loadInsights()" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="actioned">Actioned</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select [(ngModel)]="filters.type" (change)="loadInsights()" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Types</option>
              <option value="pattern">Pattern</option>
              <option value="recommendation">Recommendation</option>
              <option value="question">Question</option>
              <option value="alert">Alert</option>
              <option value="performance">Performance</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select [(ngModel)]="filters.priority" (change)="loadInsights()" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Insights List -->
      <div class="bg-white rounded-lg shadow divide-y divide-gray-100">
        <ng-container *ngIf="insights.length > 0; else noInsights">
          <div
            *ngFor="let insight of insights"
            class="p-4 hover:bg-gray-50 cursor-pointer"
            [routerLink]="['/elite/insights', insight.id]"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                [ngClass]="{
                  'bg-green-100 text-green-600': insight.insight_type === 'pattern',
                  'bg-yellow-100 text-yellow-600': insight.insight_type === 'recommendation',
                  'bg-blue-100 text-blue-600': insight.insight_type === 'question',
                  'bg-red-100 text-red-600': insight.insight_type === 'alert',
                  'bg-purple-100 text-purple-600': insight.insight_type === 'performance',
                  'bg-indigo-100 text-indigo-600': insight.insight_type === 'learning'
                }"
              >
                <span class="material-icons">{{ eliteService.getInsightTypeIcon(insight.insight_type) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [ngClass]="eliteService.getInsightPriorityClass(insight.priority)"
                  >
                    {{ insight.priority }}
                  </span>
                  <span class="text-xs text-gray-500">{{ insight.insight_type }}</span>
                  <span *ngIf="insight.status === 'new'" class="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
                <h3 class="font-medium text-gray-900">{{ insight.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ insight.summary }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span *ngIf="insight.related_subreddit">r/{{ insight.related_subreddit }}</span>
                  <span>{{ insight.created_at | date:'short' }}</span>
                </div>
              </div>
              <button
                (click)="dismissInsight($event, insight.id)"
                class="text-gray-400 hover:text-gray-600 p-1"
                title="Dismiss"
              >
                <span class="material-icons text-lg">close</span>
              </button>
            </div>
          </div>
        </ng-container>
        <ng-template #noInsights>
          <div class="p-12 text-center text-gray-500">
            <span class="material-icons text-5xl mb-3 text-gray-300">lightbulb</span>
            <p>No insights match your filters.</p>
            <p class="text-sm mt-2">The AI will create insights as it learns from your activity.</p>
          </div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalCount > insights.length" class="mt-4 flex justify-center">
        <button
          (click)="loadMore()"
          class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
          [disabled]="loading"
        >
          Load More
        </button>
      </div>
    </div>
  `
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
