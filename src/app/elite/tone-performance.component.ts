import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EliteService } from '../shared/services/elite.service';
import { TonePerformance, TonePerformanceBySubreddit, ToneType } from '../shared/models/ai-insight.model';

interface ToneStats {
  tone: ToneType;
  totalGenerated: number;
  avgApprovalRate: number;
  avgConversionRate: number;
  avgScore: number;
  subredditCount: number;
}

@Component({
  selector: 'app-tone-performance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule
  ],
  templateUrl: './tone-performance.component.html',
  styleUrls: ['./tone-performance.component.scss']
})
export class TonePerformanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  performanceData: TonePerformanceBySubreddit = {};
  totalRecords = 0;
  isLoading = true;

  selectedSubreddit = '';
  selectedTone: ToneType | '' = '';

  allTones: ToneType[] = ['casual', 'enthusiast', 'helpful', 'empathetic', 'witty', 'expert'];

  constructor(public eliteService: EliteService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.eliteService.getTonePerformance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.performanceData = response.by_subreddit;
          this.totalRecords = response.total_records;
          this.isLoading = false;
        },
        error: () => {
          this.performanceData = {};
          this.totalRecords = 0;
          this.isLoading = false;
        }
      });
  }

  get subreddits(): string[] {
    return Object.keys(this.performanceData).sort();
  }

  get toneStats(): ToneStats[] {
    const stats: Record<ToneType, ToneStats> = {} as any;

    // Initialize
    this.allTones.forEach(tone => {
      stats[tone] = {
        tone,
        totalGenerated: 0,
        avgApprovalRate: 0,
        avgConversionRate: 0,
        avgScore: 0,
        subredditCount: 0
      };
    });

    // Aggregate
    Object.values(this.performanceData).forEach(perfs => {
      perfs.forEach(perf => {
        stats[perf.tone].totalGenerated += perf.total_generated;
        stats[perf.tone].avgApprovalRate += perf.approval_rate;
        stats[perf.tone].avgConversionRate += perf.conversion_rate;
        stats[perf.tone].avgScore += perf.avg_score;
        stats[perf.tone].subredditCount++;
      });
    });

    // Calculate averages
    return this.allTones
      .map(tone => {
        const s = stats[tone];
        if (s.subredditCount > 0) {
          s.avgApprovalRate = (s.avgApprovalRate / s.subredditCount) * 100;
          s.avgConversionRate = (s.avgConversionRate / s.subredditCount) * 100;
          s.avgScore = s.avgScore / s.subredditCount;
        }
        return s;
      })
      .filter(s => s.totalGenerated > 0)
      .sort((a, b) => b.avgApprovalRate - a.avgApprovalRate);
  }

  getSubredditPerformance(subreddit: string): TonePerformance[] {
    const perfs = this.performanceData[subreddit] || [];
    if (this.selectedTone) {
      return perfs.filter(p => p.tone === this.selectedTone);
    }
    return perfs.sort((a, b) => b.approval_rate - a.approval_rate);
  }

  getBestTone(subreddit: string): ToneType | null {
    const perfs = this.performanceData[subreddit];
    if (!perfs || perfs.length === 0) return null;
    const best = perfs.reduce((a, b) => a.approval_rate > b.approval_rate ? a : b);
    return best.tone;
  }

  selectTone(tone: ToneType): void {
    this.selectedTone = this.selectedTone === tone ? '' : tone;
  }

  onSubredditChange(): void {
    // Filtering is handled in template
  }

  onToneChange(): void {
    // Filtering is handled in template
  }

  getApprovalClass(rate: number): string {
    if (rate >= 0.8) return 'text-green-600 font-medium';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getConversionClass(rate: number): string {
    if (rate >= 0.05) return 'text-green-600 font-medium';
    if (rate >= 0.02) return 'text-yellow-600';
    return 'text-gray-600';
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.toneStats.length >= 2) {
      const best = this.toneStats[0];
      const worst = this.toneStats[this.toneStats.length - 1];

      if (best.avgApprovalRate - worst.avgApprovalRate > 20) {
        recommendations.push(
          `"${this.eliteService.getToneLabel(best.tone)}" tone outperforms "${this.eliteService.getToneLabel(worst.tone)}" by ${(best.avgApprovalRate - worst.avgApprovalRate).toFixed(0)}%. Consider using it more often.`
        );
      }
    }

    // Per-subreddit recommendations
    this.subreddits.forEach(sub => {
      const perfs = this.performanceData[sub];
      if (perfs && perfs.length >= 2) {
        const sorted = [...perfs].sort((a, b) => b.approval_rate - a.approval_rate);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        if (best.approval_rate - worst.approval_rate > 0.3) {
          recommendations.push(
            `In r/${sub}, "${this.eliteService.getToneLabel(best.tone)}" works much better than "${this.eliteService.getToneLabel(worst.tone)}".`
          );
        }
      }
    });

    return recommendations.slice(0, 5); // Limit to 5
  }
}
