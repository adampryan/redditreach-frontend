import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OpportunityService } from '../shared/services';
import { EliteService } from '../shared/services/elite.service';
import { Opportunity, ResponseDraft } from '../shared/models';
import { RegenerateDialogComponent, RegenerateDialogResult } from './regenerate-dialog.component';
import { RejectOpportunityDialogComponent, RejectDialogData } from '../elite/reject-opportunity-dialog.component';

@Component({
  selector: 'app-opportunity-detail',
  standalone: false,
  templateUrl: './opportunity-detail.component.html',
  styleUrls: ['./opportunity-detail.component.scss']
})
export class OpportunityDetailComponent implements OnInit {
  opportunity: Opportunity | null = null;
  isLoading = true;
  isSubmitting = false;
  isRegenerating = false;
  selectedDraft: ResponseDraft | null = null;
  editedText = '';
  showEditMode = false;

  // Scheduling
  schedulePost = false;
  scheduledDate = '';
  scheduledTime = '';
  minDate = '';

  constructor(
    private opportunityService: OpportunityService,
    private eliteService: EliteService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOpportunity(id);
    }
  }

  loadOpportunity(id: string): void {
    this.isLoading = true;
    this.opportunityService.get(id).subscribe({
      next: (opportunity) => {
        this.opportunity = opportunity;
        // Select the first draft or the already-selected one
        if (opportunity.drafts.length > 0) {
          this.selectedDraft = opportunity.drafts.find(d => d.is_selected) || opportunity.drafts[0];
          this.editedText = this.selectedDraft.edited_text || this.selectedDraft.response_text;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectDraft(draft: ResponseDraft): void {
    this.selectedDraft = draft;
    this.editedText = draft.edited_text || draft.response_text;
    this.showEditMode = false;
  }

  toggleEditMode(): void {
    this.showEditMode = !this.showEditMode;
  }

  approve(): void {
    if (!this.opportunity || !this.selectedDraft) return;

    // Validate schedule inputs if scheduling is enabled
    if (this.schedulePost && (!this.scheduledDate || !this.scheduledTime)) {
      alert('Please select both a date and time for scheduling.');
      return;
    }

    this.isSubmitting = true;
    const editedText = this.editedText !== this.selectedDraft.response_text ? this.editedText : undefined;

    // Build scheduled_for datetime if scheduling is enabled
    let scheduledFor: string | undefined;
    if (this.schedulePost && this.scheduledDate && this.scheduledTime) {
      // Create a proper Date object and convert to ISO string with timezone
      const localDate = new Date(`${this.scheduledDate}T${this.scheduledTime}`);
      scheduledFor = localDate.toISOString();
      console.log('[Schedule] Local date input:', this.scheduledDate, this.scheduledTime);
      console.log('[Schedule] Sending ISO string:', scheduledFor);
    }

    this.opportunityService.approve(this.opportunity.id, this.selectedDraft.id, editedText, scheduledFor).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/opportunities'], { queryParams: { status: 'approved' } });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('[Schedule] Approve error:', err);
      }
    });
  }

  reject(): void {
    if (!this.opportunity) return;

    // Open the structured feedback dialog
    const dialogRef = this.dialog.open(RejectOpportunityDialogComponent, {
      width: '500px',
      data: {
        opportunityId: this.opportunity.id,
        postTitle: this.opportunity.post_title,
        draftId: this.selectedDraft?.id
      } as RejectDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Feedback was submitted successfully, navigate back
        this.router.navigate(['/opportunities']);
      }
      // If dialog was cancelled (result is null), do nothing
    });
  }

  openRedditPost(): void {
    if (this.opportunity?.reddit_post_url) {
      window.open(this.opportunity.reddit_post_url, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/opportunities']);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      pending_review: 'status-pending',
      pending_approval: 'status-pending',
      generating: 'status-pending',
      approved: 'status-approved',
      posted: 'status-posted',
      rejected: 'status-rejected',
      failed: 'status-failed',
      expired: 'status-expired'
    };
    return statusClasses[status] || '';
  }

  formatScheduledTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return 'Ready to post';
    } else if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  openRegenerateDialog(): void {
    if (!this.opportunity) return;

    const dialogRef = this.dialog.open(RegenerateDialogComponent, {
      width: '480px',
      data: {
        opportunityId: this.opportunity.id,
        postTitle: this.opportunity.post_title
      }
    });

    dialogRef.afterClosed().subscribe((result: RegenerateDialogResult | undefined) => {
      if (result) {
        this.regenerateResponse(result);
      }
    });
  }

  private regenerateResponse(options: RegenerateDialogResult): void {
    if (!this.opportunity) return;

    this.isRegenerating = true;
    this.opportunityService.regenerate(
      this.opportunity.id,
      options.strategy,
      options.includeUtm
    ).subscribe({
      next: (response) => {
        this.isRegenerating = false;
        if (response.success && response.draft) {
          // Add the new draft to the list
          const newDraft: ResponseDraft = {
            id: response.draft.id,
            variation_number: response.draft.variation_number,
            variation_label: response.draft.variation_label,
            response_text: response.draft.response_text,
            edited_text: '',
            final_text: response.draft.response_text,
            is_selected: false,
            created_at: response.draft.created_at
          };
          this.opportunity!.drafts.push(newDraft);
          // Automatically select the new draft
          this.selectDraft(newDraft);
        }
      },
      error: (err) => {
        this.isRegenerating = false;
        const errorMsg = err?.error?.error || 'Failed to generate response. Please try again.';
        alert(errorMsg);
      }
    });
  }
}
