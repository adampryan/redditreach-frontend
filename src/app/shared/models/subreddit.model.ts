export interface CustomerSubreddit {
  id: number;
  subreddit_name: string;
  keywords: string[];
  exclude_keywords: string[];
  min_post_score: number;
  max_post_age_hours: number;
  max_responses_per_day: number;
  cooldown_hours: number;
  is_active: boolean;
  last_scanned: string | null;
  total_opportunities_found: number;
  total_responses_posted: number;
  responses_today: number;
  can_respond: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubredditCreate {
  subreddit_name: string;
  keywords?: string[];
  exclude_keywords?: string[];
  min_post_score?: number;
  max_post_age_hours?: number;
  max_responses_per_day?: number;
  cooldown_hours?: number;
}
