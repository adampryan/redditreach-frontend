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
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">A/B Testing</h1>
          <p class="text-gray-600 mt-1">
            Systematically test response variations to optimize conversions
          </p>
        </div>
        <div class="flex gap-2">
          <button mat-stroked-button [matMenuTriggerFor]="quickTestMenu">
            <mat-icon>flash_on</mat-icon>
            Quick Test
          </button>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create Test
          </button>
        </div>
      </div>

      <!-- Quick Test Menu -->
      <mat-menu #quickTestMenu="matMenu">
        <button mat-menu-item (click)="createQuickTest('strategy')">
          <mat-icon>alt_route</mat-icon>
          <span>Strategy Test (Direct vs Soft)</span>
        </button>
        <button mat-menu-item (click)="createQuickTest('tone')">
          <mat-icon>record_voice_over</mat-icon>
          <span>Tone Test (Casual vs Enthusiast)</span>
        </button>
        <button mat-menu-item (click)="createQuickTest('link')">
          <mat-icon>link</mat-icon>
          <span>Link Test (With vs Without)</span>
        </button>
      </mat-menu>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <mat-card class="p-4">
          <div class="text-sm text-gray-500">Active Tests</div>
          <div class="text-2xl font-bold text-green-600">{{ activeCount }}</div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-sm text-gray-500">Completed</div>
          <div class="text-2xl font-bold text-blue-600">{{ completedCount }}</div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-sm text-gray-500">Total Samples</div>
          <div class="text-2xl font-bold text-gray-800">{{ totalSamples }}</div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-sm text-gray-500">Avg Lift</div>
          <div class="text-2xl font-bold" [ngClass]="avgLift >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ avgLift >= 0 ? '+' : '' }}{{ avgLift | number:'1.1-1' }}%
          </div>
        </mat-card>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Tabs: Active / Completed / All -->
      <mat-tab-group *ngIf="!isLoading" (selectedTabChange)="onTabChange($event)">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="mr-2">play_circle</mat-icon>
            Active ({{ activeCount }})
          </ng-template>
          <ng-container *ngTemplateOutlet="testList; context: { tests: activeTests }"></ng-container>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="mr-2">check_circle</mat-icon>
            Completed ({{ completedCount }})
          </ng-template>
          <ng-container *ngTemplateOutlet="testList; context: { tests: completedTests }"></ng-container>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="mr-2">list</mat-icon>
            All ({{ tests.length }})
          </ng-template>
          <ng-container *ngTemplateOutlet="testList; context: { tests: tests }"></ng-container>
        </mat-tab>
      </mat-tab-group>

      <!-- Test List Template -->
      <ng-template #testList let-tests="tests">
        <div class="py-4">
          <!-- Empty State -->
          <div *ngIf="tests.length === 0" class="text-center py-12">
            <mat-icon class="text-6xl text-gray-300">science</mat-icon>
            <p class="text-gray-500 mt-4">No tests in this category</p>
            <button mat-flat-button color="primary" class="mt-4" (click)="openCreateDialog()">
              Create Your First Test
            </button>
          </div>

          <!-- Test Cards -->
          <div class="space-y-4">
            <mat-card *ngFor="let test of tests" class="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      [routerLink]="['/elite/ab-tests', test.id]">
              <div class="flex justify-between items-start">
                <!-- Test Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <mat-icon [class]="getTypeIconClass(test.test_type)">
                      {{ eliteService.getABTestTypeIcon(test.test_type) }}
                    </mat-icon>
                    <h3 class="text-lg font-semibold text-gray-800">{{ test.name }}</h3>
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="eliteService.getABTestStatusClass(test.status)">
                      {{ test.status | titlecase }}
                    </span>
                  </div>

                  <!-- Variants -->
                  <div class="flex flex-wrap gap-2 mb-3">
                    <div *ngFor="let variant of test.variants"
                         class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                      <mat-icon *ngIf="variant.is_control" class="text-blue-500 text-sm" style="font-size: 14px;">
                        verified
                      </mat-icon>
                      <span>{{ variant.name }}</span>
                      <span class="text-gray-500">(n={{ variant.sample_size }})</span>
                    </div>
                  </div>

                  <!-- Performance Bars -->
                  <div class="space-y-1" *ngIf="test.variants.length > 0">
                    <div *ngFor="let variant of test.variants" class="flex items-center gap-2">
                      <span class="text-xs text-gray-500 w-24 truncate">{{ variant.name }}</span>
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                             [ngClass]="variant.is_control ? 'bg-blue-500' : 'bg-green-500'"
                             [style.width.%]="variant.approval_rate * 100">
                        </div>
                      </div>
                      <span class="text-xs font-medium w-12 text-right">
                        {{ variant.approval_rate * 100 | number:'1.0-0' }}%
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Winner Badge -->
                <div *ngIf="test.status === 'completed' && test.winning_variant" class="ml-4 text-center">
                  <div class="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <mat-icon class="text-green-500">emoji_events</mat-icon>
                    <div class="text-xs text-green-700 font-medium mt-1">
                      Winner: +{{ test.winning_lift | number:'1.1-1' }}%
                    </div>
                  </div>
                </div>

                <!-- Actions Menu -->
                <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item [routerLink]="['/elite/ab-tests', test.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>
                  <button mat-menu-item *ngIf="test.status === 'draft'" (click)="startTest(test); $event.stopPropagation()">
                    <mat-icon>play_arrow</mat-icon>
                    <span>Start Test</span>
                  </button>
                  <button mat-menu-item *ngIf="test.status === 'active'" (click)="pauseTest(test); $event.stopPropagation()">
                    <mat-icon>pause</mat-icon>
                    <span>Pause Test</span>
                  </button>
                  <button mat-menu-item *ngIf="test.status === 'paused'" (click)="resumeTest(test); $event.stopPropagation()">
                    <mat-icon>play_arrow</mat-icon>
                    <span>Resume Test</span>
                  </button>
                  <button mat-menu-item *ngIf="['active', 'paused', 'draft'].includes(test.status)"
                          (click)="cancelTest(test); $event.stopPropagation()" class="text-red-600">
                    <mat-icon class="text-red-600">cancel</mat-icon>
                    <span>Cancel Test</span>
                  </button>
                </mat-menu>
              </div>

              <!-- Timestamps -->
              <div class="flex gap-4 mt-3 text-xs text-gray-500">
                <span *ngIf="test.started_at">
                  Started: {{ test.started_at | date:'short' }}
                </span>
                <span *ngIf="test.completed_at">
                  Completed: {{ test.completed_at | date:'short' }}
                </span>
                <span *ngIf="!test.started_at">
                  Created: {{ test.created_at | date:'short' }}
                </span>
              </div>
            </mat-card>
          </div>
        </div>
      </ng-template>
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
export class ABTestsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tests: ABTest[] = [];
  isLoading = true;

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
