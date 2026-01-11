import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, OpportunityService, AuthenticationService } from '../shared/services';
import { CustomerStats, OpportunityListItem, Customer } from '../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  customer: Customer | null = null;
  stats: CustomerStats | null = null;
  recentOpportunities: OpportunityListItem[] = [];
  isLoading = true;

  constructor(
    private customerService: CustomerService,
    private opportunityService: OpportunityService,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Load customer profile
    this.customerService.getProfile().subscribe({
      next: (customer) => {
        this.customer = customer;

        // Redirect to onboarding if not completed
        if (!customer.is_onboarded) {
          this.router.navigate(['/onboarding']);
          return;
        }

        // Only load other data if onboarded
        this.loadDashboardData();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadDashboardData(): void {
    // Load stats
    this.customerService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });

    // Load recent opportunities
    this.opportunityService.list({ page_size: 10 }).subscribe({
      next: (response) => {
        this.recentOpportunities = response.results;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      pending_review: 'status-pending',
      pending_approval: 'status-pending',
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

  viewOpportunity(id: string): void {
    this.router.navigate(['/opportunities', id]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
