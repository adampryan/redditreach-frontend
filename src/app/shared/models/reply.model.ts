export interface CommentReply {
  id: number;
  reddit_reply_id: string;
  reply_author: string;
  reply_body: string;
  reply_score: number;
  reply_created_at: string;
  discovered_at: string;
  is_read: boolean;
  is_removed: boolean;
  requires_response: boolean;
  subreddit_name: string;
  original_post_title: string;
  original_post_url: string;
  our_response_preview: string;
  has_draft: boolean;
  draft_status: 'draft' | 'approved' | 'posted' | null;
  is_nested: boolean;
}

export interface CommentReplyDetail extends CommentReply {
  our_response_text: string;
  drafts: ReplyDraft[];
}

export interface ReplyDraft {
  id: number;
  response_text: string;
  status: ReplyDraftStatus;
  strategy: string | null;
  tone: string | null;
  posted_at: string | null;
  created_at: string;
}

export type ReplyDraftStatus = 'draft' | 'pending_approval' | 'approved' | 'posted' | 'rejected';

export interface ReplyStats {
  total_replies: number;
  unread_replies: number;
  needs_response: number;
  pending_drafts: number;
  subreddits: string[];
}

export interface GenerationOptions {
  response_strategies: Record<string, string>;
  reply_strategies: Record<string, string>;
  tones: Record<string, string>;
}
