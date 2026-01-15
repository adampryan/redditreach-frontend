import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EliteService } from '../shared/services/elite.service';
import { ABTest, ABTestStatus } from '../shared/models/ai-insight.model';
import { CreateABTestDialogComponent } from './create-ab-test-dialog.component';

@Component({
  selector: 'app-ab-tests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './ab-tests.component.html',
  styleUrls: ['./ab-tests.component.scss']
})
export class ABTestsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tests: ABTest[] = [];
  isLoading = true;
  activeTab: 'active' | 'completed' | 'all' = 'active';

  constructor(
    public eliteService: EliteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTests(): void {
    this.isLoading = true;
    this.eliteService.getABTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tests = response.tests;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  get activeTests(): ABTest[] {
    return this.tests.filter(t => t.status === 'active' || t.status === 'paused');
  }

  get completedTests(): ABTest[] {
    return this.tests.filter(t => t.status === 'completed');
  }

  get activeCount(): number {
    return this.tests.filter(t => t.status === 'active').length;
  }

  get completedCount(): number {
    return this.completedTests.length;
  }

  get totalSamples(): number {
    return this.tests.reduce((sum, t) =>
      sum + t.variants.reduce((vSum, v) => vSum + v.sample_size, 0), 0);
  }

  get avgLift(): number {
    const completed = this.completedTests.filter(t => t.winning_lift !== null);
    if (completed.length === 0) return 0;
    return completed.reduce((sum, t) => sum + (t.winning_lift || 0), 0) / completed.length;
  }

  getFilteredTests(): ABTest[] {
    switch (this.activeTab) {
      case 'active':
        return this.activeTests;
      case 'completed':
        return this.completedTests;
      default:
        return this.tests;
    }
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

  onTabChange(event: any): void {
    // Could add analytics tracking here
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateABTestDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadTests();
      }
    });
  }

  createQuickTest(template: 'strategy' | 'tone' | 'link'): void {
    this.eliteService.createQuickTest({ template })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTests();
            // Could show a toast here
          }
        }
      });
  }

  startTest(test: ABTest): void {
    this.eliteService.actionABTest(test.id, 'start')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTests());
  }

  pauseTest(test: ABTest): void {
    this.eliteService.actionABTest(test.id, 'pause')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTests());
  }

  resumeTest(test: ABTest): void {
    this.eliteService.actionABTest(test.id, 'resume')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTests());
  }

  cancelTest(test: ABTest): void {
    if (confirm('Are you sure you want to cancel this test?')) {
      this.eliteService.actionABTest(test.id, 'cancel')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadTests());
    }
  }
}
