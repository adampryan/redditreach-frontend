export interface OpportunityListItem {
  id: string;
  subreddit_name: string;
  post_title: string;
  post_body_preview: string;
  post_author: string;
  post_score: number;
  post_num_comments: number;
  post_created_at: string;
  post_flair: string;
  relevance_score: number;
  status: OpportunityStatus;
  is_read: boolean;
  discovered_at: string;
  age_hours: number;
  has_drafts: boolean;
  scheduled_for: string | null;
}

export interface OpportunityStats {
  total: number;
  unread: number;
  pending_review: number;
  pending_approval: number;
  approved: number;
  posted: number;
  rejected: number;
  subreddits: string[];
  last_scanned: string | null;
}

export interface Opportunity {
  id: string;
  subreddit_name: string;
  reddit_post_id: string;
  reddit_post_url: string;
  post_title: string;
  post_body: string;
  post_author: string;
  post_score: number;
  post_num_comments: number;
  post_created_at: string;
  post_flair: string;
  relevance_score: number;
  relevance_reasoning: string;
  detected_keywords: string[];
  status: OpportunityStatus;
  discovered_at: string;
  reviewed_at: string | null;
  scheduled_for: string | null;
  age_hours: number;
  is_respondable: boolean;
  drafts: ResponseDraft[];
  posted_response: PostedResponse | null;
}

export interface ResponseDraft {
  id: number;
  variation_number: number;
  variation_label: string;
  response_text: string;
  edited_text: string;
  final_text: string;
  is_selected: boolean;
  created_at: string;
}

export interface PostedResponse {
  reddit_comment_id: string;
  reddit_comment_url: string;
  final_text: string;
  posted_at: string;
  posted_by_username: string;
  comment_score: number;
  reply_count: number;
  was_removed: boolean;
  was_edited_after_post: boolean;
}

export type OpportunityStatus =
  | 'pending_review'
  | 'generating'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'posted'
  | 'failed'
  | 'expired';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
