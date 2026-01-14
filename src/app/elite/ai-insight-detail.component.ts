import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EliteService } from '../shared/services/elite.service';
import { AIInsightDetail, ActionOption } from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-ai-insight-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <!-- Back Link -->
      <a routerLink="/elite/insights" class="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">
        &larr; Back to Insights
      </a>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>

      <!-- Insight Content -->
      <div *ngIf="insight && !loading" class="bg-white rounded-lg shadow">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-start gap-4">
            <div
              class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              [ngClass]="{
                'bg-green-100 text-green-600': insight.insight_type === 'pattern',
                'bg-yellow-100 text-yellow-600': insight.insight_type === 'recommendation',
                'bg-blue-100 text-blue-600': insight.insight_type === 'question',
                'bg-red-100 text-red-600': insight.insight_type === 'alert',
                'bg-purple-100 text-purple-600': insight.insight_type === 'performance',
                'bg-indigo-100 text-indigo-600': insight.insight_type === 'learning'
              }"
            >
              <span class="material-icons text-2xl">{{ eliteService.getInsightTypeIcon(insight.insight_type) }}</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  [ngClass]="eliteService.getInsightPriorityClass(insight.priority)"
                >
                  {{ insight.priority }}
                </span>
                <span class="text-xs text-gray-500">{{ insight.insight_type }}</span>
                <span *ngIf="insight.related_subreddit" class="text-xs text-gray-500">
                  r/{{ insight.related_subreddit }}
                </span>
              </div>
              <h1 class="text-xl font-bold text-gray-900">{{ insight.title }}</h1>
              <p class="text-gray-600 mt-1">{{ insight.summary }}</p>
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Details</h2>
          <div class="prose prose-sm max-w-none text-gray-600" [innerHTML]="insight.details"></div>
        </div>

        <!-- Supporting Data -->
        <div *ngIf="insight.supporting_data && hasData(insight.supporting_data)" class="p-6 border-b border-gray-200">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Supporting Data</h2>
          <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre class="text-xs text-gray-600">{{ insight.supporting_data | json }}</pre>
          </div>
        </div>

        <!-- Action Options -->
        <div *ngIf="insight.action_options && insight.action_options.length > 0 && insight.status !== 'actioned'" class="p-6 border-b border-gray-200">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Take Action</h2>
          <div class="space-y-3">
            <div
              *ngFor="let option of insight.action_options"
              class="border rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition-colors"
              [ngClass]="{ 'border-indigo-500 bg-indigo-50': selectedAction === option.action_key }"
              (click)="selectAction(option.action_key)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium text-gray-900">{{ option.label }}</span>
                  <p class="text-sm text-gray-600 mt-1">{{ option.description }}</p>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  [ngClass]="{
                    'border-indigo-500 bg-indigo-500': selectedAction === option.action_key,
                    'border-gray-300': selectedAction !== option.action_key
                  }"
                >
                  <span *ngIf="selectedAction === option.action_key" class="material-icons text-white text-sm">check</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Feedback -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Notes (optional)</label>
            <textarea
              [(ngModel)]="feedback"
              rows="3"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Add any notes or context..."
            ></textarea>
          </div>

          <!-- Submit -->
          <div class="mt-4 flex gap-3">
            <button
              (click)="submitAction()"
              [disabled]="!selectedAction || submitting"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Submitting...' : 'Submit Response' }}
            </button>
            <button
              (click)="dismiss()"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>

        <!-- Already Actioned -->
        <div *ngIf="insight.status === 'actioned'" class="p-6 bg-green-50 border-b border-gray-200">
          <div class="flex items-center gap-3 text-green-700">
            <span class="material-icons">check_circle</span>
            <div>
              <span class="font-medium">Action taken:</span>
              <span class="ml-2">{{ insight.selected_action }}</span>
              <p *ngIf="insight.human_feedback" class="text-sm mt-1 text-green-600">
                "{{ insight.human_feedback }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div class="p-6 text-sm text-gray-500">
          <div class="flex flex-wrap gap-6">
            <div>
              <span class="font-medium">Created:</span>
              {{ insight.created_at | date:'medium' }}
            </div>
            <div *ngIf="insight.read_at">
              <span class="font-medium">Read:</span>
              {{ insight.read_at | date:'medium' }}
            </div>
            <div *ngIf="insight.actioned_at">
              <span class="font-medium">Actioned:</span>
              {{ insight.actioned_at | date:'medium' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AiInsightDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  insight: AIInsightDetail | null = null;
  loading = true;
  submitting = false;

  selectedAction = '';
  feedback = '';

  constructor(
    public eliteService: EliteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadInsight(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsight(id: string): void {
    this.loading = true;
    this.eliteService.getInsightDetail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (insight) => {
          this.insight = insight;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/elite/insights']);
        }
      });
  }

  selectAction(actionKey: string): void {
    this.selectedAction = actionKey;
  }

  submitAction(): void {
    if (!this.insight || !this.selectedAction) return;

    this.submitting = true;
    this.eliteService.actionInsight(this.insight.id, this.selectedAction, this.feedback)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.loadInsight(this.insight!.id);
        },
        error: () => {
          this.submitting = false;
        }
      });
  }

  dismiss(): void {
    if (!this.insight) return;

    this.eliteService.dismissInsight(this.insight.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/elite/insights']);
        }
      });
  }

  hasData(data: Record<string, any>): boolean {
    return data && Object.keys(data).length > 0;
  }
}
