import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OpportunityService, BulkApproval } from '../shared/services';
import { OpportunityListItem, OpportunityStats, OpportunityStatus } from '../shared/models';
import { BulkApproveDialogComponent } from './bulk-approve-dialog.component';

@Component({
  selector: 'app-opportunities-list',
  standalone: false,
  templateUrl: './opportunities-list.component.html',
  styleUrls: ['./opportunities-list.component.scss']
})
export class OpportunitiesListComponent implements OnInit {
  opportunities: OpportunityListItem[] = [];
  stats: OpportunityStats | null = null;
  isLoading = true;
  isGenerating = false;
  currentStatus: string = 'all';
  currentSubreddits: string[] = [];
  currentIntentTier: string = '';
  currentHasDrafts: string = '';  // '', 'true', 'false'
  currentSort: string = 'time';
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;

  // Bulk selection
  selectedIds: Set<string> = new Set();
  selectAll = false;

  // Expanded draft previews (track which cards are expanded)
  expandedDrafts: Set<string> = new Set();

  statusFilters: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'posted', label: 'Posted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ];

  intentTierFilters: { value: string; label: string }[] = [
    { value: '', label: 'All Tiers' },
    { value: 'tier_1', label: 'Tier 1 - High Intent' },
    { value: 'tier_2', label: 'Tier 2 - Medium' },
    { value: 'tier_3', label: 'Tier 3 - Low' },
    { value: 'tier_4', label: 'Tier 4 - Engage Only' }
  ];

  draftFilters: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'true', label: 'With Drafts' },
    { value: 'false', label: 'Without Drafts' }
  ];

  sortOptions: { value: string; label: string }[] = [
    { value: 'time', label: 'Newest First' },
    { value: '-time', label: 'Oldest First' },
    { value: 'relevance', label: 'Highest Relevance' },
    { value: 'score', label: 'Highest Score' },
    { value: 'subreddit', label: 'Subreddit A-Z' },
    { value: '-subreddit', label: 'Subreddit Z-A' }
  ];

  constructor(
    private opportunityService: OpportunityService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.route.queryParams.subscribe(params => {
      this.currentStatus = params['status'] || 'all';
      this.currentSort = params['sort'] || 'time';
      this.currentSubreddits = params['subreddits'] ? params['subreddits'].split(',') : [];
      this.currentIntentTier = params['intent_tier'] || '';
      this.currentHasDrafts = params['has_drafts'] || '';
      this.currentPage = parseInt(params['page'], 10) || 1;
      this.loadOpportunities();
    });
  }

  loadStats(): void {
    this.opportunityService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: () => {
        this.stats = null;
      }
    });
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.selectedIds.clear();
    this.selectAll = false;

    const filters: any = {
      page: this.currentPage,
      page_size: this.pageSize,
      sort: this.currentSort
    };

    // Handle status filter
    if (this.currentStatus === 'unread') {
      filters.is_read = false;
    } else if (this.currentStatus && this.currentStatus !== 'all') {
      filters.status = this.currentStatus;
    }

    // Handle subreddits filter
    if (this.currentSubreddits.length > 0) {
      filters.subreddits = this.currentSubreddits.join(',');
    }

    // Handle intent tier filter
    if (this.currentIntentTier) {
      filters.intent_tier = this.currentIntentTier;
    }

    // Handle has_drafts filter
    if (this.currentHasDrafts) {
      filters.has_drafts = this.currentHasDrafts === 'true';
    }

    this.opportunityService.list(filters).subscribe({
      next: (response) => {
        this.opportunities = response.results;
        this.totalCount = response.count;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  refresh(): void {
    this.loadStats();
    this.loadOpportunities();
  }

  filterByStatus(status: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onSubredditsChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        subreddits: this.currentSubreddits.length > 0 ? this.currentSubreddits.join(',') : null,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  onSortChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: this.currentSort, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onIntentTierChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { intent_tier: this.currentIntentTier || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onHasDraftsChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { has_drafts: this.currentHasDrafts || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  viewOpportunity(opportunity: OpportunityListItem): void {
    // Mark as read when viewing
    if (!opportunity.is_read) {
      this.opportunityService.markRead(opportunity.id).subscribe();
      opportunity.is_read = true;
    }
    this.router.navigate(['/opportunities', opportunity.id]);
  }

  // Bulk selection methods
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.opportunities.forEach(opp => this.selectedIds.add(opp.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelection(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectAll = this.selectedIds.size === this.opportunities.length;
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  get hasSelections(): boolean {
    return this.selectedIds.size > 0;
  }

  // Bulk actions
  bulkMarkRead(): void {
    if (this.selectedIds.size === 0) return;

    const ids = Array.from(this.selectedIds);
    this.opportunityService.bulkRead(ids).subscribe({
      next: () => {
        // Update local state
        this.opportunities.forEach(opp => {
          if (this.selectedIds.has(opp.id)) {
            opp.is_read = true;
          }
        });
        this.selectedIds.clear();
        this.selectAll = false;
        this.loadStats();
      }
    });
  }

  bulkReject(): void {
    if (this.selectedIds.size === 0) return;

    const ids = Array.from(this.selectedIds);
    this.opportunityService.bulkStatus(ids, 'rejected').subscribe({
      next: () => {
        this.loadOpportunities();
        this.loadStats();
      }
    });
  }

  bulkRestore(): void {
    if (this.selectedIds.size === 0) return;

    const ids = Array.from(this.selectedIds);
    this.opportunityService.bulkStatus(ids, 'pending_review').subscribe({
      next: () => {
        this.loadOpportunities();
        this.loadStats();
      }
    });
  }

  /**
   * Bulk generate drafts for selected opportunities that don't have drafts.
   */
  bulkGenerate(): void {
    const idsWithoutDrafts = Array.from(this.selectedIds).filter(id => {
      const opp = this.opportunities.find(o => o.id === id);
      return opp && !opp.has_drafts;
    });

    if (idsWithoutDrafts.length === 0) {
      this.snackBar.open('All selected opportunities already have drafts', 'OK', { duration: 3000 });
      return;
    }

    this.isGenerating = true;
    this.opportunityService.bulkGenerate(idsWithoutDrafts).subscribe({
      next: (result) => {
        this.isGenerating = false;
        this.snackBar.open(
          `Generated drafts for ${result.generated_count} opportunities`,
          'OK',
          { duration: 3000 }
        );
        this.loadOpportunities();
        this.loadStats();
      },
      error: (err) => {
        this.isGenerating = false;
        this.snackBar.open('Failed to generate drafts', 'OK', { duration: 3000 });
      }
    });
  }

  /**
   * Open dialog to select drafts and bulk approve.
   */
  bulkApprove(): void {
    const idsWithDrafts = Array.from(this.selectedIds).filter(id => {
      const opp = this.opportunities.find(o => o.id === id);
      return opp && opp.has_drafts;
    });

    if (idsWithDrafts.length === 0) {
      this.snackBar.open('No selected opportunities have drafts to approve', 'OK', { duration: 3000 });
      return;
    }

    // Open dialog with the opportunities that have drafts
    const dialogRef = this.dialog.open(BulkApproveDialogComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: { opportunityIds: idsWithDrafts }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.approved) {
        this.snackBar.open(
          `Approved ${result.approved_count} opportunities`,
          'OK',
          { duration: 3000 }
        );
        this.loadOpportunities();
        this.loadStats();
      }
    });
  }

  /**
   * Check if any selected opportunities don't have drafts.
   */
  get canBulkGenerate(): boolean {
    return Array.from(this.selectedIds).some(id => {
      const opp = this.opportunities.find(o => o.id === id);
      return opp && !opp.has_drafts;
    });
  }

  /**
   * Check if any selected opportunities have drafts.
   */
  get canBulkApprove(): boolean {
    return Array.from(this.selectedIds).some(id => {
      const opp = this.opportunities.find(o => o.id === id);
      return opp && opp.has_drafts;
    });
  }

  /**
   * Toggle draft preview expansion for a card.
   */
  toggleDraftPreview(id: string, event: Event): void {
    event.stopPropagation();
    if (this.expandedDrafts.has(id)) {
      this.expandedDrafts.delete(id);
    } else {
      this.expandedDrafts.add(id);
    }
  }

  isDraftExpanded(id: string): boolean {
    return this.expandedDrafts.has(id);
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

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onPageChange(event: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: event.pageIndex + 1 },
      queryParamsHandling: 'merge'
    });
  }

  getTimeAgo(hours: number): string {
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.round(hours)}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatScheduledTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return 'Ready to post';
    } else if (diffHours < 24) {
      return `In ${diffHours}h`;
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  truncateText(text: string, maxLength: number = 200): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatIntentTier(tier: string): string {
    const tierLabels: Record<string, string> = {
      'tier_1': 'T1 - High',
      'tier_2': 'T2 - Medium',
      'tier_3': 'T3 - Low',
      'tier_4': 'T4 - Engage'
    };
    return tierLabels[tier] || tier;
  }

  getTierClass(tier: string): string {
    return tier ? `tier-${tier}` : '';
  }
}
