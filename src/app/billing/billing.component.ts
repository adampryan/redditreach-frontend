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
  isCancelling = false;
  checkoutError = '';
  successMessage = '';
  showCancelConfirm = false;

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

  cancelSubscription(): void {
    this.isCancelling = true;
    this.checkoutError = '';

    this.billingService.cancelSubscription().subscribe({
      next: (response) => {
        this.successMessage = 'Your subscription will be cancelled at the end of the billing period. You can resume anytime before then.';
        this.showCancelConfirm = false;
        this.isCancelling = false;
        this.loadBillingStatus();
      },
      error: (error) => {
        this.isCancelling = false;
        this.checkoutError = error.error?.error || 'Failed to cancel subscription. Please try again.';
      }
    });
  }

  pauseSubscription(): void {
    this.isCancelling = true;
    this.checkoutError = '';

    this.billingService.pauseSubscription(1).subscribe({
      next: (response) => {
        this.successMessage = 'Your subscription has been paused. We\'ll be here when you\'re ready to come back!';
        this.showCancelConfirm = false;
        this.isCancelling = false;
        this.loadBillingStatus();
      },
      error: (error) => {
        this.isCancelling = false;
        this.checkoutError = error.error?.error || 'Failed to pause subscription. Please try again.';
      }
    });
  }

  resumeSubscription(): void {
    this.isCancelling = true;
    this.checkoutError = '';

    this.billingService.resumeSubscription().subscribe({
      next: (response) => {
        this.successMessage = 'Welcome back! Your subscription has been resumed.';
        this.isCancelling = false;
        this.loadBillingStatus();
      },
      error: (error) => {
        this.isCancelling = false;
        this.checkoutError = error.error?.error || 'Failed to resume subscription. Please try again.';
      }
    });
  }

  isCurrentPlan(tier: string): boolean {
    return this.billingStatus?.subscription_tier === tier;
  }

  getButtonText(plan: Plan): string {
    const tierOrder = ['trial', 'starter', 'growth', 'scale', 'agency'];
    const currentTier = this.billingStatus?.subscription_tier || 'trial';
    const currentIndex = tierOrder.indexOf(currentTier);
    const planIndex = tierOrder.indexOf(plan.tier);

    // Check if user has a real plan (not trial)
    const hasPaidTier = currentTier !== 'trial' && currentIndex > 0;

    // New users or trial - "Start with"
    if (!hasPaidTier) {
      if (plan.tier === 'agency') {
        return `Go all in with ${plan.name}`;
      }
      return `Start with ${plan.name}`;
    }

    // Users with a plan (with or without active Stripe sub)
    if (planIndex > currentIndex) {
      // Upgrade
      if (plan.tier === 'agency') {
        return `Go big with ${plan.name}`;
      }
      return `Level up to ${plan.name}`;
    } else {
      // Downgrade
      if (plan.tier === 'starter') {
        return `Keep it simple with ${plan.name}`;
      }
      return `Switch to ${plan.name}`;
    }
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
