export interface CustomerActivity {
  id: number;
  action: ActivityAction;
  details: Record<string, any>;
  opportunity: string | null;
  opportunity_title: string | null;
  created_at: string;
}

export type ActivityAction =
  | 'opportunity_found'
  | 'response_generated'
  | 'response_approved'
  | 'response_rejected'
  | 'response_edited'
  | 'response_posted'
  | 'response_failed'
  | 'subreddit_added'
  | 'subreddit_removed'
  | 'settings_updated'
  | 'reddit_connected'
  | 'reddit_disconnected'
  | 'subscription_changed';
