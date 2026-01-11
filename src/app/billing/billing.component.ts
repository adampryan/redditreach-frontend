import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingService, Plan, BillingStatus } from '../shared/services';

@Component({
  selector: 'app-billing',
  standalone: false,
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  isLoading = true;
  billingStatus: BillingStatus | null = null;
  plans: Plan[] = [];
  currentPlan: Plan | undefined;

  isCheckingOut = false;
  checkoutError = '';
  successMessage = '';

  constructor(
    private billingService: BillingService,
    private route: ActivatedRoute
  ) {
    this.plans = billingService.plans;
  }

  ngOnInit(): void {
    this.loadBillingStatus();
    this.handleQueryParams();
  }

  handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['billing'] === 'success') {
        this.successMessage = 'Your subscription has been activated! Thank you for subscribing.';
        this.loadBillingStatus(); // Reload to get updated status
      }
      if (params['billing'] === 'cancelled') {
        this.checkoutError = 'Checkout was cancelled. You can try again when ready.';
      }
    });
  }

  loadBillingStatus(): void {
    this.isLoading = true;
    this.billingService.getStatus().subscribe({
      next: (status) => {
        this.billingStatus = status;
        this.currentPlan = this.billingService.getPlanByTier(status.subscription_tier);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  subscribe(tier: string): void {
    this.isCheckingOut = true;
    this.checkoutError = '';

    this.billingService.createCheckout(tier).subscribe({
      next: (response) => {
        // Redirect to Stripe Checkout
        window.location.href = response.checkout_url;
      },
      error: (error) => {
        this.isCheckingOut = false;
        this.checkoutError = error.error?.error || 'Failed to start checkout. Please try again.';
      }
    });
  }

  manageSubscription(): void {
    this.billingService.createPortalSession().subscribe({
      next: (response) => {
        window.location.href = response.portal_url;
      },
      error: (error) => {
        this.checkoutError = error.error?.error || 'Failed to open billing portal.';
      }
    });
  }

  isCurrentPlan(tier: string): boolean {
    return this.billingStatus?.subscription_tier === tier;
  }

  formatDate(timestamp: number | null): string {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
