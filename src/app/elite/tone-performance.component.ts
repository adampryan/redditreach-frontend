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
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Tone Performance</h1>
          <p class="text-gray-600 mt-1">
            Analyze which response tones work best for each subreddit
          </p>
        </div>
        <button mat-stroked-button (click)="loadData()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading && totalRecords > 0">
        <!-- Overall Tone Stats -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <mat-card *ngFor="let stat of toneStats"
                    class="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    [ngClass]="selectedTone === stat.tone ? 'ring-2 ring-offset-2' : ''"
                    [style.--tw-ring-color]="eliteService.getToneColor(stat.tone)"
                    (click)="selectTone(stat.tone)">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" [style.background-color]="eliteService.getToneColor(stat.tone)"></div>
              <span class="text-sm font-medium text-gray-700">{{ eliteService.getToneLabel(stat.tone) }}</span>
            </div>
            <div class="text-2xl font-bold text-gray-800">{{ stat.avgApprovalRate | number:'1.0-0' }}%</div>
            <div class="text-xs text-gray-500">{{ stat.totalGenerated }} responses</div>
          </mat-card>
        </div>

        <!-- Filter -->
        <div class="flex items-center gap-4 mb-6">
          <mat-form-field appearance="outline" class="w-48">
            <mat-label>Filter by Subreddit</mat-label>
            <mat-select [(ngModel)]="selectedSubreddit" (selectionChange)="onSubredditChange()">
              <mat-option value="">All Subreddits</mat-option>
              <mat-option *ngFor="let sub of subreddits" [value]="sub">r/{{ sub }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-48">
            <mat-label>Filter by Tone</mat-label>
            <mat-select [(ngModel)]="selectedTone" (selectionChange)="onToneChange()">
              <mat-option value="">All Tones</mat-option>
              <mat-option *ngFor="let tone of allTones" [value]="tone">
                {{ eliteService.getToneLabel(tone) }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Subreddit-by-Subreddit View -->
        <mat-card class="mb-6" *ngIf="!selectedSubreddit">
          <mat-card-header>
            <mat-card-title>Performance by Subreddit</mat-card-title>
            <mat-card-subtitle>Best performing tone for each subreddit</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="space-y-4">
              <div *ngFor="let sub of subreddits" class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-800">r/{{ sub }}</h4>
                  <span *ngIf="getBestTone(sub)" class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">Best:</span>
                    <span class="px-2 py-0.5 rounded text-xs font-medium"
                          [style.background-color]="eliteService.getToneColor(getBestTone(sub)!) + '20'"
                          [style.color]="eliteService.getToneColor(getBestTone(sub)!)">
                      {{ eliteService.getToneLabel(getBestTone(sub)!) }}
                    </span>
                  </span>
                </div>

                <!-- Tone Bars for this subreddit -->
                <div class="space-y-2">
                  <div *ngFor="let perf of getSubredditPerformance(sub)" class="flex items-center gap-3">
                    <div class="w-24 flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" [style.background-color]="eliteService.getToneColor(perf.tone)"></div>
                      <span class="text-xs text-gray-600">{{ eliteService.getToneLabel(perf.tone) }}</span>
                    </div>
                    <div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.background-color]="eliteService.getToneColor(perf.tone)"
                           [style.width.%]="perf.approval_rate * 100">
                      </div>
                    </div>
                    <span class="w-12 text-xs text-right font-medium">
                      {{ perf.approval_rate * 100 | number:'1.0-0' }}%
                    </span>
                    <span class="w-16 text-xs text-gray-400">
                      n={{ perf.total_generated }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Single Subreddit Detail View -->
        <mat-card class="mb-6" *ngIf="selectedSubreddit">
          <mat-card-header>
            <mat-card-title>r/{{ selectedSubreddit }} - Tone Performance</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Approval Rate -->
              <div>
                <h4 class="text-sm text-gray-600 mb-3">Approval Rate by Tone</h4>
                <div class="space-y-3">
                  <div *ngFor="let perf of getSubredditPerformance(selectedSubreddit)"
                       class="flex items-center gap-3">
                    <div class="w-24 flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full" [style.background-color]="eliteService.getToneColor(perf.tone)"></div>
                      <span class="text-sm">{{ eliteService.getToneLabel(perf.tone) }}</span>
                    </div>
                    <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.background-color]="eliteService.getToneColor(perf.tone)"
                           [style.width.%]="perf.approval_rate * 100">
                      </div>
                    </div>
                    <span class="w-16 text-sm text-right font-medium">
                      {{ perf.approval_rate * 100 | number:'1.1-1' }}%
                    </span>
                  </div>
                </div>
              </div>

              <!-- Conversion Rate -->
              <div>
                <h4 class="text-sm text-gray-600 mb-3">Conversion Rate by Tone</h4>
                <div class="space-y-3">
                  <div *ngFor="let perf of getSubredditPerformance(selectedSubreddit)"
                       class="flex items-center gap-3">
                    <div class="w-24 flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full" [style.background-color]="eliteService.getToneColor(perf.tone)"></div>
                      <span class="text-sm">{{ eliteService.getToneLabel(perf.tone) }}</span>
                    </div>
                    <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [style.background-color]="eliteService.getToneColor(perf.tone)"
                           [style.width.%]="perf.conversion_rate * 100 * 10">
                      </div>
                    </div>
                    <span class="w-16 text-sm text-right font-medium">
                      {{ perf.conversion_rate * 100 | number:'1.2-2' }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats Table -->
            <div class="mt-6 overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-left text-sm text-gray-500 border-b">
                    <th class="pb-2">Tone</th>
                    <th class="pb-2 text-right">Generated</th>
                    <th class="pb-2 text-right">Approval %</th>
                    <th class="pb-2 text-right">Conversion %</th>
                    <th class="pb-2 text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let perf of getSubredditPerformance(selectedSubreddit)" class="border-b last:border-0">
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" [style.background-color]="eliteService.getToneColor(perf.tone)"></div>
                        <span class="font-medium">{{ eliteService.getToneLabel(perf.tone) }}</span>
                      </div>
                    </td>
                    <td class="py-3 text-right text-gray-600">{{ perf.total_generated }}</td>
                    <td class="py-3 text-right">
                      <span [ngClass]="getApprovalClass(perf.approval_rate)">
                        {{ perf.approval_rate * 100 | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <span [ngClass]="getConversionClass(perf.conversion_rate)">
                        {{ perf.conversion_rate * 100 | number:'1.2-2' }}%
                      </span>
                    </td>
                    <td class="py-3 text-right text-gray-600">{{ perf.avg_score | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recommendations -->
        <mat-card class="mb-6">
          <mat-card-header class="bg-blue-50 -mx-4 -mt-4 px-4 py-3 mb-4">
            <mat-icon class="text-blue-500 mr-2">tips_and_updates</mat-icon>
            <mat-card-title class="text-lg">Tone Recommendations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-3">
              <div *ngFor="let rec of getRecommendations()" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <mat-icon class="text-blue-500">lightbulb</mat-icon>
                <div>
                  <p class="text-sm text-gray-800">{{ rec }}</p>
                </div>
              </div>
              <div *ngIf="getRecommendations().length === 0" class="text-center py-4 text-gray-500">
                <mat-icon class="text-3xl text-gray-300">check_circle</mat-icon>
                <p class="mt-2 text-sm">Collect more data to generate recommendations</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Summary -->
        <div class="text-center text-sm text-gray-500">
          Total records: {{ totalRecords | number }} across {{ subreddits.length }} subreddits
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && totalRecords === 0" class="text-center py-12">
        <mat-icon class="text-6xl text-gray-300">record_voice_over</mat-icon>
        <p class="text-gray-500 mt-4">No tone performance data yet</p>
        <p class="text-gray-400 text-sm">Tone tracking begins once responses are generated and feedback is collected</p>
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
