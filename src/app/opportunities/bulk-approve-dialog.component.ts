import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OpportunityService, BulkApproval } from '../shared/services';
import { Opportunity, ResponseDraft } from '../shared/models';
import { forkJoin } from 'rxjs';

interface DialogData {
  opportunityIds: string[];
}

interface OpportunityWithSelection {
  opportunity: Opportunity;
  selectedDraftId: number | null;
  isLoading: boolean;
}

@Component({
  selector: 'app-bulk-approve-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Approve Selected Opportunities</h2>

    <mat-dialog-content>
      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading opportunities...</p>
      </div>

      <div *ngIf="!isLoading && items.length === 0" class="empty">
        <p>No opportunities with drafts found.</p>
      </div>

      <div *ngIf="!isLoading && items.length > 0" class="opportunities-list">
        <p class="instructions">Select which draft to approve for each opportunity:</p>

        <div class="opportunity-item" *ngFor="let item of items">
          <div class="opportunity-header">
            <span class="subreddit">r/{{ item.opportunity.subreddit_name }}</span>
            <span class="title">{{ truncate(item.opportunity.post_title, 60) }}</span>
          </div>

          <div class="drafts-list">
            <div
              class="draft-option"
              *ngFor="let draft of item.opportunity.drafts"
              [class.selected]="item.selectedDraftId === draft.id"
              (click)="selectDraft(item, draft.id)">
              <mat-radio-button
                [checked]="item.selectedDraftId === draft.id"
                [value]="draft.id">
              </mat-radio-button>
              <div class="draft-content">
                <span class="draft-label">{{ draft.variation_label || 'Draft ' + draft.variation_number }}</span>
                <span class="draft-preview">{{ truncate(draft.final_text || draft.response_text, 150) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!canApprove || isApproving"
        (click)="approve()">
        <span *ngIf="!isApproving">Approve {{ selectedCount }} Opportunities</span>
        <span *ngIf="isApproving">Approving...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 600px;
      max-height: 60vh;
    }

    .loading, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #666;
    }

    .instructions {
      margin-bottom: 16px;
      color: #666;
      font-size: 14px;
    }

    .opportunities-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .opportunity-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
    }

    .opportunity-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;

      .subreddit {
        font-size: 12px;
        font-weight: 600;
        color: #667eea;
      }

      .title {
        font-size: 14px;
        color: #333;
        flex: 1;
      }
    }

    .drafts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .draft-option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #f8f9fa;
      }

      &.selected {
        background: #e8f0fe;
        border: 1px solid #667eea;
      }
    }

    .draft-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .draft-label {
        font-size: 12px;
        font-weight: 600;
        color: #333;
      }

      .draft-preview {
        font-size: 13px;
        color: #666;
        line-height: 1.4;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class BulkApproveDialogComponent implements OnInit {
  items: OpportunityWithSelection[] = [];
  isLoading = true;
  isApproving = false;

  constructor(
    private dialogRef: MatDialogRef<BulkApproveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: DialogData,
    private opportunityService: OpportunityService
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    this.isLoading = true;

    // Load each opportunity to get its drafts
    const requests = this.data.opportunityIds.map(id =>
      this.opportunityService.get(id)
    );

    forkJoin(requests).subscribe({
      next: (opportunities) => {
        this.items = opportunities
          .filter(opp => opp.drafts && opp.drafts.length > 0)
          .map(opp => ({
            opportunity: opp,
            selectedDraftId: opp.drafts[0]?.id || null,  // Pre-select first draft
            isLoading: false
          }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectDraft(item: OpportunityWithSelection, draftId: number): void {
    item.selectedDraftId = draftId;
  }

  get canApprove(): boolean {
    return this.items.some(item => item.selectedDraftId !== null);
  }

  get selectedCount(): number {
    return this.items.filter(item => item.selectedDraftId !== null).length;
  }

  truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  approve(): void {
    const approvals: BulkApproval[] = this.items
      .filter(item => item.selectedDraftId !== null)
      .map(item => ({
        opportunity_id: item.opportunity.id,
        draft_id: item.selectedDraftId!
      }));

    if (approvals.length === 0) return;

    this.isApproving = true;
    this.opportunityService.bulkApprove(approvals).subscribe({
      next: (result) => {
        this.isApproving = false;
        this.dialogRef.close({
          approved: true,
          approved_count: result.approved_count,
          failed_count: result.failed_count
        });
      },
      error: () => {
        this.isApproving = false;
      }
    });
  }
}
