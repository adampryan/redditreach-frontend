import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Plan {
  tier: string;
  name: string;
  price: number;
  opportunities: number;
  responses: number;
  subreddits: number;
  features: string[];
}

export interface AccessStatus {
  can_access: boolean;
  status: 'active' | 'trial_active' | 'trial_expired' | 'no_subscription';
  message: string | null;
  trial_days_remaining?: number | null;
  trial_ends_at?: string | null;
  trial_ended_at?: string | null;
}

export interface BillingStatus {
  has_subscription: boolean;
  subscription_tier: string;
  subscription_status: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  // Trial status
  is_on_trial: boolean;
  trial_days_remaining: number | null;
  trial_ends_at: string | null;
  is_trial_expired: boolean;
  can_use_service: boolean;
  access_status: AccessStatus;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface PortalResponse {
  portal_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = environment.API_BASE_URL;

  // Plan definitions (matches backend TIER_LIMITS)
  readonly plans: Plan[] = [
    {
      tier: 'starter',
      name: 'Starter',
      price: 79,
      opportunities: 50,
      responses: 20,
      subreddits: 3,
      features: [
        '50 opportunities/month',
        '20 responses/month',
        '3 subreddits',
        'AI response generation',
        'Basic analytics'
      ]
    },
    {
      tier: 'growth',
      name: 'Growth',
      price: 179,
      opportunities: 150,
      responses: 60,
      subreddits: 10,
      features: [
        '150 opportunities/month',
        '60 responses/month',
        '10 subreddits',
        'AI response generation',
        'Full analytics & ROI tracking',
        'Priority support'
      ]
    },
    {
      tier: 'scale',
      name: 'Scale',
      price: 349,
      opportunities: 400,
      responses: 150,
      subreddits: 25,
      features: [
        '400 opportunities/month',
        '150 responses/month',
        '25 subreddits',
        'AI response generation',
        'Full analytics & ROI tracking',
        'Priority support',
        'Custom response templates'
      ]
    },
    {
      tier: 'agency',
      name: 'Agency',
      price: 799,
      opportunities: 9999,
      responses: 500,
      subreddits: 100,
      features: [
        'Unlimited opportunities',
        '500 responses/month',
        '100 subreddits',
        'AI response generation',
        'Full analytics & ROI tracking',
        'Dedicated support',
        'Custom response templates',
        'API access'
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  getStatus(): Observable<BillingStatus> {
    return this.http.get<BillingStatus>(`${this.apiUrl}/billing/status/`);
  }

  createCheckout(tier: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/billing/checkout/`, { tier });
  }

  createPortalSession(): Observable<PortalResponse> {
    return this.http.post<PortalResponse>(`${this.apiUrl}/billing/portal/`, {});
  }

  cancelSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/billing/cancel/`, {});
  }

  pauseSubscription(months: number = 1): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/billing/pause/`, { months });
  }

  resumeSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/billing/resume/`, {});
  }

  getPlanByTier(tier: string): Plan | undefined {
    return this.plans.find(p => p.tier === tier);
  }
}
