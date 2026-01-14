import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplyService } from '../shared/services';
import { CommentReplyDetail, ReplyDraft } from '../shared/models';
import { GenerateReplyDialogComponent, GenerateReplyDialogResult } from './generate-reply-dialog.component';

@Component({
  selector: 'app-reply-detail',
  standalone: false,
  templateUrl: './reply-detail.component.html',
  styleUrls: ['./reply-detail.component.scss']
})
export class ReplyDetailComponent implements OnInit {
  reply: CommentReplyDetail | null = null;
  isLoading = true;
  isSubmitting = false;
  isGenerating = false;
  selectedDraft: ReplyDraft | null = null;
  editedText = '';
  showEditMode = false;
  showManualDraft = false;
  manualDraftText = '';

  constructor(
    private replyService: ReplyService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReply(parseInt(id, 10));
    }
  }

  loadReply(id: number): void {
    this.isLoading = true;
    this.replyService.get(id).subscribe({
      next: (reply) => {
        this.reply = reply;

        // Mark as read if unread
        if (!reply.is_read) {
          this.replyService.markRead(id).subscribe();
        }

        // Select the first draft if available
        if (reply.drafts && reply.drafts.length > 0) {
          this.selectedDraft = reply.drafts[0];
          this.editedText = this.selectedDraft.response_text;
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectDraft(draft: ReplyDraft): void {
    this.selectedDraft = draft;
    this.editedText = draft.response_text;
    this.showEditMode = false;
    this.showManualDraft = false;
  }

  toggleEditMode(): void {
    this.showEditMode = !this.showEditMode;
    this.showManualDraft = false;
  }

  toggleManualDraft(): void {
    this.showManualDraft = !this.showManualDraft;
    this.showEditMode = false;
    this.selectedDraft = null;
    this.manualDraftText = '';
  }

  openGenerateDialog(): void {
    if (!this.reply) return;

    const dialogRef = this.dialog.open(GenerateReplyDialogComponent, {
      width: '480px',
      data: {
        replyId: this.reply.id,
        replyBody: this.reply.reply_body
      }
    });

    dialogRef.afterClosed().subscribe((result: GenerateReplyDialogResult | undefined) => {
      if (result) {
        this.generateDraft(result);
      }
    });
  }

  private generateDraft(options: GenerateReplyDialogResult): void {
    if (!this.reply) return;

    this.isGenerating = true;
    this.cdr.detectChanges();

    this.replyService.generateDraft(
      this.reply.id,
      options.strategy,
      options.tone
    ).subscribe({
      next: (response) => {
        this.isGenerating = false;
        if (response.success && response.draft) {
          // Add the new draft
          const newDraft = response.draft;
          if (!this.reply!.drafts) {
            this.reply!.drafts = [];
          }
          this.reply!.drafts.push(newDraft);
          this.selectDraft(newDraft);
          this.cdr.detectChanges();
          this.snackBar.open('AI reply generated!', 'Dismiss', { duration: 3000 });
        }
      },
      error: (err) => {
        this.isGenerating = false;
        this.cdr.detectChanges();
        const errorMsg = err?.error?.error || 'Failed to generate reply. Please try again.';
        this.snackBar.open(errorMsg, 'Dismiss', { duration: 5000 });
      }
    });
  }

  saveManualDraft(): void {
    if (!this.reply || !this.manualDraftText.trim()) return;

    this.isSubmitting = true;
    this.replyService.createDraft(this.reply.id, this.manualDraftText).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success && response.draft) {
          if (!this.reply!.drafts) {
            this.reply!.drafts = [];
          }
          this.reply!.drafts.push(response.draft);
          this.selectDraft(response.draft);
          this.showManualDraft = false;
          this.manualDraftText = '';
          this.cdr.detectChanges();
          this.snackBar.open('Draft saved!', 'Dismiss', { duration: 3000 });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('Failed to save draft', 'Dismiss', { duration: 5000 });
      }
    });
  }

  updateDraft(): void {
    if (!this.selectedDraft || !this.editedText.trim()) return;

    this.isSubmitting = true;
    this.replyService.updateDraft(this.selectedDraft.id, this.editedText).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success && response.draft) {
          // Update the draft in our local array
          const index = this.reply!.drafts.findIndex(d => d.id === this.selectedDraft!.id);
          if (index >= 0) {
            this.reply!.drafts[index] = response.draft;
          }
          this.selectedDraft = response.draft;
          this.showEditMode = false;
          this.cdr.detectChanges();
          this.snackBar.open('Draft updated!', 'Dismiss', { duration: 3000 });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('Failed to update draft', 'Dismiss', { duration: 5000 });
      }
    });
  }

  approve(): void {
    if (!this.selectedDraft) return;

    this.isSubmitting = true;
    this.replyService.approveDraft(this.selectedDraft.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Reply approved and queued for posting!', 'Dismiss', { duration: 4000 });
        this.router.navigate(['/replies'], { queryParams: { filter: '' } });
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMsg = err?.error?.error || 'Failed to approve reply. Please try again.';
        this.snackBar.open(errorMsg, 'Dismiss', { duration: 5000 });
      }
    });
  }

  deleteDraft(): void {
    if (!this.selectedDraft) return;

    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    this.isSubmitting = true;
    this.replyService.deleteDraft(this.selectedDraft.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Remove from local array
        if (this.reply) {
          this.reply.drafts = this.reply.drafts.filter(d => d.id !== this.selectedDraft!.id);
        }
        this.selectedDraft = null;
        this.editedText = '';
        this.showEditMode = false;

        // Select next draft if available
        if (this.reply?.drafts && this.reply.drafts.length > 0) {
          this.selectDraft(this.reply.drafts[0]);
        }

        this.cdr.detectChanges();
        this.snackBar.open('Draft deleted', 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMsg = err?.error?.error || 'Failed to delete draft. Please try again.';
        this.snackBar.open(errorMsg, 'Dismiss', { duration: 5000 });
      }
    });
  }

  toggleNeedsResponse(): void {
    if (!this.reply) return;

    const newValue = !this.reply.requires_response;
    this.replyService.flagForResponse(this.reply.id, newValue).subscribe({
      next: (response) => {
        if (this.reply) {
          this.reply.requires_response = response.requires_response;
        }
      }
    });
  }

  dismissReply(): void {
    if (!this.reply) return;

    if (!confirm('Dismiss this reply? It will be removed from your list.')) {
      return;
    }

    this.isSubmitting = true;
    this.replyService.dismiss(this.reply.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Reply dismissed', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/replies']);
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('Failed to dismiss reply', 'Dismiss', { duration: 5000 });
      }
    });
  }

  openRedditPost(): void {
    if (this.reply?.original_post_url) {
      window.open(this.reply.original_post_url, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/replies']);
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const days = Math.floor(diffHours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  getDraftStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'status-draft',
      pending_approval: 'status-pending',
      approved: 'status-approved',
      posted: 'status-posted',
      rejected: 'status-rejected'
    };
    return classes[status] || '';
  }

  formatDraftStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
