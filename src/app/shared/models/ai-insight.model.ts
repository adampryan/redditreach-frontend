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
    success_type: string;
    clicks: number;
    reply_sentiment: string;
    created_at: string;
  }[];
}
