import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OpportunityService } from '../shared/services';
import { Opportunity, ResponseDraft } from '../shared/models';

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
  selectedDraft: ResponseDraft | null = null;
  editedText = '';
  showEditMode = false;

  constructor(
    private opportunityService: OpportunityService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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

    this.isSubmitting = true;
    const editedText = this.editedText !== this.selectedDraft.response_text ? this.editedText : undefined;

    this.opportunityService.approve(this.opportunity.id, this.selectedDraft.id, editedText).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/opportunities'], { queryParams: { status: 'approved' } });
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  reject(): void {
    if (!this.opportunity) return;

    this.isSubmitting = true;
    this.opportunityService.reject(this.opportunity.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/opportunities']);
      },
      error: () => {
        this.isSubmitting = false;
      }
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
}
