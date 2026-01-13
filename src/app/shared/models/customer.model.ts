export interface Customer {
  id: string;
  name: string;
  email: string;
  website: string;
  product_description: string;
  target_audience: string;
  tone_preferences: string;
  things_to_avoid: string;
  example_response: string;
  keywords: string[];
  negative_keywords: string[];
  link_display_name: string;
  subscription_tier: 'trial' | 'starter' | 'growth' | 'scale' | 'agency';
  tier_limits: TierLimits;
  opportunities_remaining: number;
  responses_remaining: number;
  subreddits_remaining: number;
  opportunities_this_period: number;
  responses_posted_this_period: number;
  reddit_username: string;
  reddit_connected: boolean;
  // Email notification preferences
  email_notifications_enabled: boolean;
  notify_on_opportunities: boolean;
  notify_on_responses_ready: boolean;
  notification_frequency: 'instant' | 'daily' | 'weekly';
  // Extension API key for Chrome extension
  extension_api_key: string;
  is_active: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierLimits {
  opportunities: number;
  responses: number;
  subreddits: number;
}

export interface CustomerStats {
  opportunities_this_period: number;
  responses_posted_this_period: number;
  opportunities_remaining: number;
  responses_remaining: number;
  subreddits_used: number;
  subreddits_remaining: number;
  pending_review: number;
  pending_approval: number;
  approved: number;
  posted: number;
  rejected: number;
  subscription_tier: string;
  tier_limits: TierLimits;
  unread_support_count: number;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tokens: {
    access: string;
    refresh: string;
  };
  customer?: Customer;
}
