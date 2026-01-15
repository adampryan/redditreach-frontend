import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EliteService } from '../shared/services/elite.service';
import { RejectionReasonOption, RejectionReasonType, RejectionRequest } from '../shared/models/ai-insight.model';

export interface RejectDialogData {
  opportunityId: string;
  postTitle: string;
  draftId?: string;
}

@Component({
  selector: 'app-reject-opportunity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <span class="material-icons text-red-500">feedback</span>
      Reject with Feedback
    </h2>

    <mat-dialog-content class="min-w-[400px]">
      <p class="text-gray-600 text-sm mb-4">
        Help improve future responses by telling us why this wasn't right.
      </p>

      <!-- Post title for context -->
      <div class="bg-gray-50 p-3 rounded-lg mb-4">
        <p class="text-xs text-gray-500 mb-1">Rejecting response for:</p>
        <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ data.postTitle }}</p>
      </div>

      <!-- Rejection Reason -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Primary Reason</mat-label>
        <mat-select [(ngModel)]="selectedReason" required>
          <mat-option *ngFor="let reason of reasons" [value]="reason.value">
            {{ reason.label }}
          </mat-option>
        </mat-select>
        <mat-icon matPrefix>category</mat-icon>
      </mat-form-field>

      <!-- Confidence Slider -->
      <div class="mb-4">
        <label class="text-sm text-gray-700 mb-2 block">
          How confident are you in this rejection?
        </label>
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-500">Unsure</span>
          <mat-slider min="1" max="5" step="1" discrete class="flex-1">
            <input matSliderThumb [(ngModel)]="confidence">
          </mat-slider>
          <span class="text-xs text-gray-500">Very Sure</span>
        </div>
        <div class="text-center text-sm font-medium mt-1" [ngClass]="getConfidenceClass()">
          {{ getConfidenceLabel() }}
        </div>
      </div>

      <!-- Explanation (Optional) -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>What was wrong? (Optional)</mat-label>
        <textarea
          matInput
          [(ngModel)]="explanation"
          rows="2"
          placeholder="E.g., 'Too direct for this subreddit's culture'"
        ></textarea>
        <mat-icon matPrefix>notes</mat-icon>
      </mat-form-field>

      <!-- Improvement Suggestion (Optional) -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>What would make it better? (Optional)</mat-label>
        <textarea
          matInput
          [(ngModel)]="improvementSuggestion"
          rows="2"
          placeholder="E.g., 'Focus more on their specific pain point'"
        ></textarea>
        <mat-icon matPrefix>lightbulb</mat-icon>
      </mat-form-field>

      <!-- Learning Note -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
        <div class="flex items-start gap-2">
          <span class="material-icons text-blue-500 text-lg">school</span>
          <div class="text-xs text-blue-700">
            <strong>This helps the AI learn!</strong> Your feedback is used to improve
            future response quality and avoid similar issues.
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-flat-button
        color="warn"
        (click)="onSubmit()"
        [disabled]="!selectedReason || isSubmitting"
      >
        <mat-spinner *ngIf="isSubmitting" diameter="20" class="inline-block mr-2"></mat-spinner>
        {{ isSubmitting ? 'Submitting...' : 'Reject & Submit Feedback' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-content {
      max-height: 70vh;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class RejectOpportunityDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reasons: RejectionReasonOption[] = [];
  selectedReason: RejectionReasonType | null = null;
  confidence = 3;
  explanation = '';
  improvementSuggestion = '';
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<RejectOpportunityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectDialogData,
    private eliteService: EliteService
  ) {}

  ngOnInit(): void {
    this.loadRejectionReasons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRejectionReasons(): void {
    this.eliteService.getRejectionReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reasons = response.reasons;
        },
        error: () => {
          // Fallback to hardcoded reasons if API fails
          this.reasons = [
            { value: 'tone_mismatch', label: 'Tone Mismatch - Doesn\'t fit the context' },
            { value: 'too_promotional', label: 'Too Promotional - Sounds salesy/spammy' },
            { value: 'factually_wrong', label: 'Factually Wrong - Contains errors' },
            { value: 'off_topic', label: 'Off Topic - Doesn\'t address the post' },
            { value: 'low_quality', label: 'Low Quality - Poorly written' },
            { value: 'wrong_strategy', label: 'Wrong Strategy - Too direct/subtle' },
            { value: 'timing_bad', label: 'Bad Timing - Post too old or wrong time' },
            { value: 'duplicate', label: 'Duplicate - Already responded' },
            { value: 'not_relevant', label: 'Not Relevant - Post isn\'t a good fit' },
            { value: 'risky_subreddit', label: 'Risky Subreddit - Too dangerous to post' },
            { value: 'other', label: 'Other - Custom reason' }
          ];
        }
      });
  }

  getConfidenceLabel(): string {
    const labels: Record<number, string> = {
      1: 'Not sure',
      2: 'Somewhat unsure',
      3: 'Neutral',
      4: 'Fairly confident',
      5: 'Very confident'
    };
    return labels[this.confidence] || '';
  }

  getConfidenceClass(): string {
    if (this.confidence <= 2) return 'text-gray-500';
    if (this.confidence === 3) return 'text-blue-500';
    return 'text-green-600';
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (!this.selectedReason) return;

    this.isSubmitting = true;

    const request: RejectionRequest = {
      reason: this.selectedReason,
      confidence: this.confidence,
      explanation: this.explanation.trim() || undefined,
      improvement_suggestion: this.improvementSuggestion.trim() || undefined,
      draft_id: this.data.draftId
    };

    this.eliteService.rejectOpportunity(this.data.opportunityId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dialogRef.close({
            success: true,
            reason: this.selectedReason,
            rejectionId: response.rejection_id
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to submit rejection:', err);
          // Could show a toast here
        }
      });
  }
}
