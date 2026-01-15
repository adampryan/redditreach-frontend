import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EliteService } from '../shared/services/elite.service';
import { ABTestDetail, ABTestVariant } from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-ab-test-detail',
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
    MatMenuModule
  ],
  template: `
    <div class="container mx-auto p-6 max-w-5xl">
      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Error -->
      <div *ngIf="!isLoading && !test" class="text-center py-12">
        <mat-icon class="text-6xl text-gray-300">error_outline</mat-icon>
        <p class="text-gray-500 mt-4">Test not found</p>
        <button mat-flat-button color="primary" class="mt-4" routerLink="/elite/ab-tests">
          Back to Tests
        </button>
      </div>

      <div *ngIf="test">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <button mat-button routerLink="/elite/ab-tests" class="mb-2">
              <mat-icon>arrow_back</mat-icon>
              Back to Tests
            </button>
            <div class="flex items-center gap-3">
              <mat-icon [class]="getTypeIconClass(test.test_type)" class="text-3xl">
                {{ eliteService.getABTestTypeIcon(test.test_type) }}
              </mat-icon>
              <div>
                <h1 class="text-2xl font-bold text-gray-800">{{ test.name }}</h1>
                <div class="flex items-center gap-2 mt-1">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="eliteService.getABTestStatusClass(test.status)">
                    {{ test.status | titlecase }}
                  </span>
                  <span class="text-gray-500 text-sm capitalize">{{ test.test_type }} Test</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button mat-stroked-button *ngIf="test.status === 'draft'" (click)="startTest()">
              <mat-icon>play_arrow</mat-icon>
              Start Test
            </button>
            <button mat-stroked-button *ngIf="test.status === 'active'" (click)="pauseTest()">
              <mat-icon>pause</mat-icon>
              Pause
            </button>
            <button mat-stroked-button *ngIf="test.status === 'paused'" (click)="resumeTest()">
              <mat-icon>play_arrow</mat-icon>
              Resume
            </button>
            <button mat-stroked-button color="warn"
                    *ngIf="['active', 'paused', 'draft'].includes(test.status)"
                    (click)="cancelTest()">
              <mat-icon>cancel</mat-icon>
              Cancel
            </button>
          </div>
        </div>

        <!-- Winner Banner -->
        <mat-card *ngIf="test.status === 'completed' && test.winning_variant" class="mb-6 bg-green-50 border-green-200">
          <mat-card-content class="flex items-center gap-4 p-4">
            <mat-icon class="text-green-500 text-4xl">emoji_events</mat-icon>
            <div>
              <h3 class="text-lg font-semibold text-green-800">Winner: {{ getWinnerName() }}</h3>
              <p class="text-green-700">
                +{{ test.winning_lift | number:'1.1-1' }}% lift over control with
                {{ getWinnerConfidence() | number:'1.0-0' }}% confidence
              </p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Test Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Total Samples</div>
            <div class="text-2xl font-bold text-gray-800">{{ getTotalSamples() }}</div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Traffic %</div>
            <div class="text-2xl font-bold text-blue-600">{{ test.traffic_percentage }}%</div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Min Sample Size</div>
            <div class="text-2xl font-bold text-gray-800">{{ test.min_sample_size }}</div>
          </mat-card>
          <mat-card class="p-4">
            <div class="text-sm text-gray-500">Confidence Target</div>
            <div class="text-2xl font-bold text-purple-600">{{ test.confidence_threshold * 100 | number:'1.0-0' }}%</div>
          </mat-card>
        </div>

        <!-- Progress to Significance -->
        <mat-card class="mb-6 p-4" *ngIf="test.status === 'active'">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Progress to Minimum Sample Size</h3>
          <div class="space-y-3">
            <div *ngFor="let variant of test.variants" class="flex items-center gap-3">
              <span class="w-32 text-sm truncate">{{ variant.name }}</span>
              <mat-progress-bar mode="determinate"
                               [value]="getProgressPercent(variant)"
                               [color]="variant.is_control ? 'primary' : 'accent'"
                               class="flex-1">
              </mat-progress-bar>
              <span class="text-sm text-gray-600 w-24 text-right">
                {{ variant.sample_size }} / {{ test.min_sample_size }}
              </span>
            </div>
          </div>
        </mat-card>

        <!-- Variant Performance -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Variant Performance</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-left text-sm text-gray-500 border-b">
                    <th class="pb-2">Variant</th>
                    <th class="pb-2 text-right">Samples</th>
                    <th class="pb-2 text-right">Approval Rate</th>
                    <th class="pb-2 text-right">Conversion Rate</th>
                    <th class="pb-2 text-right">Clicks</th>
                    <th class="pb-2 text-right">Lift</th>
                    <th class="pb-2 text-right">Significance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let variant of test.variants" class="border-b last:border-0">
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <mat-icon *ngIf="variant.is_control" class="text-blue-500 text-sm"
                                  matTooltip="Control variant">verified</mat-icon>
                        <mat-icon *ngIf="test.winning_variant === variant.id" class="text-green-500 text-sm"
                                  matTooltip="Winner">emoji_events</mat-icon>
                        <span class="font-medium">{{ variant.name }}</span>
                      </div>
                    </td>
                    <td class="py-3 text-right">{{ variant.sample_size }}</td>
                    <td class="py-3 text-right">
                      <span [ngClass]="getApprovalRateClass(variant)">
                        {{ variant.approval_rate * 100 | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <span [ngClass]="getConversionRateClass(variant)">
                        {{ variant.conversion_rate * 100 | number:'1.2-2' }}%
                      </span>
                    </td>
                    <td class="py-3 text-right">{{ variant.total_clicks || 0 }}</td>
                    <td class="py-3 text-right">
                      <span *ngIf="!variant.is_control" [ngClass]="getLiftClass(variant)">
                        {{ getLift(variant) >= 0 ? '+' : '' }}{{ getLift(variant) | number:'1.1-1' }}%
                      </span>
                      <span *ngIf="variant.is_control" class="text-gray-400">baseline</span>
                    </td>
                    <td class="py-3 text-right">
                      <ng-container *ngIf="!variant.is_control && test.statistical_analysis">
                        <span *ngIf="test.statistical_analysis[variant.id]?.is_significant"
                              class="text-green-600 font-medium">
                          Significant
                        </span>
                        <span *ngIf="!test.statistical_analysis[variant.id]?.is_significant"
                              class="text-gray-400">
                          Not yet
                        </span>
                      </ng-container>
                      <span *ngIf="variant.is_control" class="text-gray-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Visual Comparison -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Visual Comparison</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="space-y-4">
              <!-- Approval Rate Bars -->
              <div>
                <h4 class="text-sm text-gray-600 mb-2">Approval Rate</h4>
                <div class="space-y-2">
                  <div *ngFor="let variant of test.variants" class="flex items-center gap-3">
                    <span class="w-24 text-sm truncate">{{ variant.name }}</span>
                    <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [ngClass]="variant.is_control ? 'bg-blue-500' : 'bg-green-500'"
                           [style.width.%]="variant.approval_rate * 100">
                      </div>
                    </div>
                    <span class="w-16 text-sm text-right font-medium">
                      {{ variant.approval_rate * 100 | number:'1.1-1' }}%
                    </span>
                  </div>
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Conversion Rate Bars -->
              <div>
                <h4 class="text-sm text-gray-600 mb-2">Conversion Rate</h4>
                <div class="space-y-2">
                  <div *ngFor="let variant of test.variants" class="flex items-center gap-3">
                    <span class="w-24 text-sm truncate">{{ variant.name }}</span>
                    <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [ngClass]="variant.is_control ? 'bg-blue-500' : 'bg-purple-500'"
                           [style.width.%]="variant.conversion_rate * 100 * 10">
                      </div>
                    </div>
                    <span class="w-16 text-sm text-right font-medium">
                      {{ variant.conversion_rate * 100 | number:'1.2-2' }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Statistical Analysis -->
        <mat-card class="mb-6" *ngIf="test.statistical_analysis && hasStatisticalData()">
          <mat-card-header>
            <mat-card-title>Statistical Analysis</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let variant of getNonControlVariants()" class="border rounded-lg p-4">
                <h4 class="font-medium text-gray-800 mb-2">{{ variant.name }} vs Control</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">P-Value:</span>
                    <span class="font-mono">
                      {{ test.statistical_analysis[variant.id]?.p_value | number:'1.4-4' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Confidence:</span>
                    <span [ngClass]="getConfidenceClass(test.statistical_analysis[variant.id]?.confidence)">
                      {{ (test.statistical_analysis[variant.id]?.confidence || 0) * 100 | number:'1.1-1' }}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Lift:</span>
                    <span [ngClass]="getLiftClass(variant)">
                      {{ (test.statistical_analysis[variant.id]?.lift || 0) >= 0 ? '+' : '' }}{{ (test.statistical_analysis[variant.id]?.lift || 0) * 100 | number:'1.1-1' }}%
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Status:</span>
                    <span class="px-2 py-0.5 rounded text-xs font-medium"
                          [ngClass]="test.statistical_analysis[variant.id]?.is_significant ?
                                    'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                      {{ test.statistical_analysis[variant.id]?.is_significant ? 'Significant' : 'Not Significant' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Targeting Info -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Targeting Configuration</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="text-sm text-gray-600 mb-2">Target Subreddits</h4>
                <div *ngIf="test.target_subreddits.length > 0" class="flex flex-wrap gap-2">
                  <span *ngFor="let sub of test.target_subreddits"
                        class="px-2 py-1 bg-gray-100 rounded text-sm">
                    r/{{ sub }}
                  </span>
                </div>
                <span *ngIf="test.target_subreddits.length === 0" class="text-gray-400">
                  All subreddits
                </span>
              </div>
              <div>
                <h4 class="text-sm text-gray-600 mb-2">Target Intent Tiers</h4>
                <div *ngIf="test.target_intent_tiers.length > 0" class="flex flex-wrap gap-2">
                  <span *ngFor="let tier of test.target_intent_tiers"
                        class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {{ eliteService.getIntentTierLabel(tier) }}
                  </span>
                </div>
                <span *ngIf="test.target_intent_tiers.length === 0" class="text-gray-400">
                  All tiers
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Timestamps -->
        <div class="text-sm text-gray-500 text-center">
          Created: {{ test.created_at | date:'medium' }}
          <span *ngIf="test.started_at"> | Started: {{ test.started_at | date:'medium' }}</span>
          <span *ngIf="test.completed_at"> | Completed: {{ test.completed_at | date:'medium' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class ABTestDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  testId: string = '';
  test: ABTestDetail | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public eliteService: EliteService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.testId = params['id'];
      this.loadTest();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTest(): void {
    this.isLoading = true;
    this.eliteService.getABTestDetail(this.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (test) => {
          this.test = test;
          this.isLoading = false;
        },
        error: () => {
          this.test = null;
          this.isLoading = false;
        }
      });
  }

  getTypeIconClass(type: string): string {
    const colors: Record<string, string> = {
      'strategy': 'text-purple-500',
      'tone': 'text-blue-500',
      'content': 'text-green-500',
      'timing': 'text-orange-500',
      'link': 'text-pink-500',
      'custom': 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  }

  getTotalSamples(): number {
    if (!this.test) return 0;
    return this.test.variants.reduce((sum, v) => sum + v.sample_size, 0);
  }

  getProgressPercent(variant: ABTestVariant): number {
    if (!this.test) return 0;
    return Math.min(100, (variant.sample_size / this.test.min_sample_size) * 100);
  }

  getControlVariant(): ABTestVariant | undefined {
    return this.test?.variants.find(v => v.is_control);
  }

  getNonControlVariants(): ABTestVariant[] {
    return this.test?.variants.filter(v => !v.is_control) || [];
  }

  getWinnerName(): string {
    if (!this.test?.winning_variant) return '';
    const winner = this.test.variants.find(v => v.id === this.test!.winning_variant);
    return winner?.name || '';
  }

  getWinnerConfidence(): number {
    if (!this.test?.winning_variant || !this.test.statistical_analysis) return 0;
    const analysis = this.test.statistical_analysis[this.test.winning_variant];
    return (analysis?.confidence || 0) * 100;
  }

  getLift(variant: ABTestVariant): number {
    const control = this.getControlVariant();
    if (!control || control.approval_rate === 0) return 0;
    return ((variant.approval_rate - control.approval_rate) / control.approval_rate) * 100;
  }

  getLiftClass(variant: ABTestVariant): string {
    const lift = this.getLift(variant);
    if (lift > 5) return 'text-green-600 font-medium';
    if (lift < -5) return 'text-red-600';
    return 'text-gray-600';
  }

  getApprovalRateClass(variant: ABTestVariant): string {
    const control = this.getControlVariant();
    if (!control || variant.is_control) return 'text-gray-800';
    if (variant.approval_rate > control.approval_rate) return 'text-green-600 font-medium';
    if (variant.approval_rate < control.approval_rate) return 'text-red-600';
    return 'text-gray-800';
  }

  getConversionRateClass(variant: ABTestVariant): string {
    const control = this.getControlVariant();
    if (!control || variant.is_control) return 'text-gray-800';
    if (variant.conversion_rate > control.conversion_rate) return 'text-green-600 font-medium';
    if (variant.conversion_rate < control.conversion_rate) return 'text-red-600';
    return 'text-gray-800';
  }

  getConfidenceClass(confidence: number | undefined): string {
    if (!confidence) return 'text-gray-600';
    if (confidence >= 0.95) return 'text-green-600 font-medium';
    if (confidence >= 0.80) return 'text-yellow-600';
    return 'text-gray-600';
  }

  hasStatisticalData(): boolean {
    return this.test?.statistical_analysis !== undefined &&
           Object.keys(this.test.statistical_analysis).length > 0;
  }

  startTest(): void {
    if (!this.test) return;
    this.eliteService.actionABTest(this.test.id, 'start')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTest());
  }

  pauseTest(): void {
    if (!this.test) return;
    this.eliteService.actionABTest(this.test.id, 'pause')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTest());
  }

  resumeTest(): void {
    if (!this.test) return;
    this.eliteService.actionABTest(this.test.id, 'resume')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTest());
  }

  cancelTest(): void {
    if (!this.test) return;
    if (confirm('Are you sure you want to cancel this test?')) {
      this.eliteService.actionABTest(this.test.id, 'cancel')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadTest());
    }
  }
}
