/**
 * AI-Human Communication Dashboard Models
 *
 * Elite Conversion System: The AI proactively shares insights about
 * patterns, recommendations, questions, alerts, and performance summaries.
 */

export type InsightType = 'pattern' | 'recommendation' | 'question' | 'alert' | 'performance' | 'learning';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightStatus = 'new' | 'read' | 'acknowledged' | 'actioned' | 'dismissed';

export interface AIInsight {
  id: string;
  insight_type: InsightType;
  priority: InsightPriority;
  title: string;
  summary: string;
  status: InsightStatus;
  related_subreddit: string;
  created_at: string;
  read_at: string | null;
}

export interface AIInsightDetail extends AIInsight {
  details: string;
  action_options: ActionOption[];
  selected_action: string;
  human_feedback: string;
  supporting_data: Record<string, any>;
  actioned_at: string | null;
}

export interface ActionOption {
  label: string;
  action_key: string;
  description: string;
}

export interface AIInsightStats {
  total: number;
  new: number;
  high_priority: number;
  pending_action: number;
  by_type: Record<InsightType, number>;
}

// Intent tier types for the Elite Conversion System
export type IntentTier = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';
export type ResponseStrategy = 'direct_solution' | 'empathy_with_solution' | 'soft_mention' | 'pure_engagement' | 'skip';

export interface IntentTierStats {
  total: number;
  posted: number;
  approved: number;
  rejected: number;
  successful_outcomes: number;
  clicks: number;
  conversions: number;
}

export interface StrategyStats {
  total: number;
  posted: number;
  success_rate: number;
  clicks: number;
}

export interface ConversionPattern {
  id: number;
  pattern_type: 'keyword' | 'subreddit' | 'timing' | 'author' | 'strategy' | 'content';
  name: string;
  description: string;
  sample_size: number;
  conversion_rate: number;
  lift_vs_baseline: number;
  confidence: number;
}

export interface EliteDashboardData {
  intent_distribution: Record<IntentTier, number>;
  metrics: {
    total_opportunities: number;
    posted_responses: number;
    tier_1_2_rate: number;
    success_rate: number;
    total_clicks: number;
    total_conversions: number;
  };
  pending_insights: {
    id: string;
    type: InsightType;
    priority: InsightPriority;
    title: string;
    summary: string;
  }[];
  top_subreddits: {
    name: string;
    expected_value: number;
    conversion_rate: number;
    total_responses: number;
    approval_rate: number;
  }[];
  recent_outcomes: {
    opportunity_id: string;
    subreddit: string;
    post_title: string;
    success_type: string;
    clicks: number;
    reply_sentiment: string;
    created_at: string;
  }[];
}


// =============================================================================
// PHASE 5: Human-AI Collaboration & A/B Testing Models
// =============================================================================

/**
 * Structured rejection reasons for learning why responses are rejected.
 */
export type RejectionReasonType =
  | 'tone_mismatch'
  | 'too_promotional'
  | 'factually_wrong'
  | 'off_topic'
  | 'low_quality'
  | 'wrong_strategy'
  | 'timing_bad'
  | 'duplicate'
  | 'not_relevant'
  | 'risky_subreddit'
  | 'other';

export interface RejectionReasonOption {
  value: RejectionReasonType;
  label: string;
}

export interface RejectionRequest {
  reason: RejectionReasonType;
  explanation?: string;
  confidence?: number; // 1-5
  improvement_suggestion?: string;
  draft_id?: string;
}

export interface RejectionResponse {
  success: boolean;
  rejection_id: string;
  message: string;
}

/**
 * A/B Test for systematically testing response variations.
 */
export type ABTestStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ABTestType = 'strategy' | 'tone' | 'content' | 'timing' | 'link' | 'custom';

export interface ABTestVariant {
  id: string;
  name: string;
  is_control: boolean;
  config: Record<string, any>;
  sample_size: number;
  approval_rate: number;
  conversion_rate: number;
  engagement_rate?: number;
  total_approved?: number;
  total_rejected?: number;
  total_posted?: number;
  total_clicks?: number;
  total_conversions?: number;
}

export interface ABTest {
  id: string;
  name: string;
  test_type: ABTestType;
  status: ABTestStatus;
  variants: ABTestVariant[];
  winning_variant: string | null;
  winning_lift: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ABTestDetail extends ABTest {
  description?: string;
  target_subreddits: string[];
  target_intent_tiers: string[];
  min_sample_size: number;
  confidence_threshold: number;
  traffic_percentage: number;
  statistical_analysis?: Record<string, {
    is_significant: boolean;
    p_value: number;
    lift: number;
    confidence: number;
  }>;
}

export interface ABTestCreateRequest {
  name: string;
  test_type: ABTestType;
  variants: {
    name: string;
    config: Record<string, any>;
    is_control?: boolean;
  }[];
  target_subreddits?: string[];
  target_intent_tiers?: string[];
  min_sample_size?: number;
  traffic_percentage?: number;
}

export interface QuickTestRequest {
  template: 'strategy' | 'tone' | 'link';
  name?: string;
  options?: string[];
  subreddits?: string[];
}

/**
 * Tone performance tracking per subreddit.
 */
export type ToneType = 'casual' | 'enthusiast' | 'helpful' | 'empathetic' | 'witty' | 'expert';

export interface TonePerformance {
  tone: ToneType;
  total_generated: number;
  approval_rate: number;
  conversion_rate: number;
  avg_score: number;
}

export interface TonePerformanceBySubreddit {
  [subreddit: string]: TonePerformance[];
}

export interface TonePerformanceResponse {
  by_subreddit: TonePerformanceBySubreddit;
  total_records: number;
}

/**
 * Human feedback summary with AI recommendations.
 */
export interface FeedbackIssue {
  reason: RejectionReasonType;
  count: number;
  percentage: number;
  description: string;
}

export interface ProblematicSubreddit {
  subreddit: string;
  rejection_rate: number;
  total_rejections: number;
  top_reason: RejectionReasonType | null;
}

export interface AIRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  action: string;
  rationale: string;
}

export interface FeedbackSummary {
  total_approvals: number;
  total_rejections: number;
  approval_rate: number;
  rejection_breakdown: Record<RejectionReasonType, number>;
  top_issues: FeedbackIssue[];
  problematic_subreddits: ProblematicSubreddit[];
  problematic_strategies: { strategy: string; rejections: number }[];
  recommendations: AIRecommendation[];
  last_analysis_at: string | null;
}

/**
 * Phase 5 Dashboard aggregate data.
 */
export interface Phase5DashboardData {
  feedback_summary: FeedbackSummary;
  active_tests: ABTest[];
  tone_performance: TonePerformanceBySubreddit;
  recent_insights: AIInsight[];
}
