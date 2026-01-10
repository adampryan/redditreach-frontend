import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OpportunityService } from '../shared/services';
import { OpportunityListItem, OpportunityStatus } from '../shared/models';

@Component({
  selector: 'app-opportunities-list',
  standalone: false,
  templateUrl: './opportunities-list.component.html',
  styleUrls: ['./opportunities-list.component.scss']
})
export class OpportunitiesListComponent implements OnInit {
  opportunities: OpportunityListItem[] = [];
  isLoading = true;
  currentStatus: string = '';
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;

  statusFilters: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'posted', label: 'Posted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ];

  constructor(
    private opportunityService: OpportunityService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentStatus = params['status'] || '';
      this.currentPage = parseInt(params['page'], 10) || 1;
      this.loadOpportunities();
    });
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.opportunityService.list({
      status: this.currentStatus || undefined,
      page: this.currentPage,
      page_size: this.pageSize
    }).subscribe({
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

  filterByStatus(status: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  viewOpportunity(id: string): void {
    this.router.navigate(['/opportunities', id]);
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
}
