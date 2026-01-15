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
  templateUrl: './ab-test-detail.component.html',
  styleUrls: ['./ab-test-detail.component.scss']
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
