import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AIInsight,
  AIInsightDetail,
  AIInsightStats,
  ConversionPattern,
  EliteDashboardData,
  InsightPriority,
  InsightStatus,
  InsightType,
  IntentTierStats,
  StrategyStats,
  // Phase 5 models
  ABTest,
  ABTestDetail,
  ABTestCreateRequest,
  QuickTestRequest,
  RejectionReasonOption,
  RejectionRequest,
  RejectionResponse,
  RejectionReasonType,
  FeedbackSummary,
  TonePerformanceResponse,
  ToneType
} from '../models/ai-insight.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class EliteService {
  private readonly baseUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  // =========================================================================
  // AI Insights - Communication Dashboard
  // =========================================================================

  /**
   * Get list of AI insights with optional filtering.
   */
  getInsights(params?: {
    status?: InsightStatus;
    type?: InsightType;
    priority?: InsightPriority;
    page?: number;
  }): Observable<PaginatedResponse<AIInsight>> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());

    return this.http.get<PaginatedResponse<AIInsight>>(`${this.baseUrl}/ai-insights/`, { params: httpParams });
  }

  /**
   * Get AI insight statistics for the dashboard.
   */
  getInsightStats(): Observable<AIInsightStats> {
    return this.http.get<AIInsightStats>(`${this.baseUrl}/ai-insights/stats/`);
  }

  /**
   * Get detailed AI insight by ID.
   */
  getInsightDetail(insightId: string): Observable<AIInsightDetail> {
    return this.http.get<AIInsightDetail>(`${this.baseUrl}/ai-insights/${insightId}/`);
  }

  /**
   * Take action on an AI insight.
   */
  actionInsight(insightId: string, actionKey: string, feedback?: string): Observable<{ success: boolean; status: string; selected_action: string }> {
    return this.http.post<{ success: boolean; status: string; selected_action: string }>(
      `${this.baseUrl}/ai-insights/${insightId}/action/`,
      { action_key: actionKey, feedback: feedback || '' }
    );
  }

  /**
   * Dismiss an AI insight.
   */
  dismissInsight(insightId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/ai-insights/${insightId}/dismiss/`, {});
  }

  // =========================================================================
  // Elite Dashboard & Stats
  // =========================================================================

  /**
   * Get comprehensive Elite dashboard data.
   */
  getEliteDashboard(): Observable<EliteDashboardData> {
    return this.http.get<EliteDashboardData>(`${this.baseUrl}/elite-dashboard/`);
  }

  /**
   * Get intent tier statistics.
   */
  getIntentStats(): Observable<{
    tier_stats: Record<string, IntentTierStats>;
    tier_counts: Record<string, number>;
  }> {
    return this.http.get<{
      tier_stats: Record<string, IntentTierStats>;
      tier_counts: Record<string, number>;
    }>(`${this.baseUrl}/opportunities/intent-stats/`);
  }

  /**
   * Get response strategy statistics.
   */
  getStrategyStats(): Observable<{
    strategy_stats: Record<string, StrategyStats>;
    strategy_counts: Record<string, number>;
  }> {
    return this.http.get<{
      strategy_stats: Record<string, StrategyStats>;
      strategy_counts: Record<string, number>;
    }>(`${this.baseUrl}/opportunities/strategy-stats/`);
  }

  /**
   * Get learned conversion patterns.
   */
  getConversionPatterns(): Observable<{ patterns: ConversionPattern[] }> {
    return this.http.get<{ patterns: ConversionPattern[] }>(`${this.baseUrl}/conversion-patterns/`);
  }

  /**
   * Generate response on-demand for an opportunity.
   */
  generateOnDemand(opportunityId: string): Observable<{
    success: boolean;
    drafts_generated?: number;
    status?: string;
    error?: string;
  }> {
    return this.http.post<{
      success: boolean;
      drafts_generated?: number;
      status?: string;
      error?: string;
    }>(`${this.baseUrl}/opportunities/${opportunityId}/generate/`, {});
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Get display name for intent tier.
   */
  getIntentTierLabel(tier: string): string {
    const labels: Record<string, string> = {
      'tier_1': 'Active Seeking',
      'tier_2': 'Pain Expression',
      'tier_3': 'Implicit Need',
      'tier_4': 'Engagement Only'
    };
    return labels[tier] || tier;
  }

  /**
   * Get description for intent tier.
   */
  getIntentTierDescription(tier: string): string {
    const descriptions: Record<string, string> = {
      'tier_1': 'Explicitly looking for a solution (5-15% conversion)',
      'tier_2': 'Expressing frustration the product could solve (2-5% conversion)',
      'tier_3': 'Discussing relevant topics, might benefit (0.5-2% conversion)',
      'tier_4': 'Community engagement, no purchase intent (<0.1% conversion)'
    };
    return descriptions[tier] || '';
  }

  /**
   * Get display name for response strategy.
   */
  getStrategyLabel(strategy: string): string {
    const labels: Record<string, string> = {
      'direct_solution': 'Direct Solution',
      'empathy_with_solution': 'Empathy + Solution',
      'soft_mention': 'Soft Mention',
      'pure_engagement': 'Pure Engagement',
      'skip': 'Skip'
    };
    return labels[strategy] || strategy;
  }

  /**
   * Get color class for insight priority.
   */
  getInsightPriorityClass(priority: InsightPriority): string {
    const classes: Record<InsightPriority, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get icon for insight type.
   */
  getInsightTypeIcon(type: InsightType): string {
    const icons: Record<InsightType, string> = {
      'pattern': 'trending_up',
      'recommendation': 'lightbulb',
      'question': 'help',
      'alert': 'warning',
      'performance': 'analytics',
      'learning': 'school'
    };
    return icons[type] || 'info';
  }

  // =========================================================================
  // PHASE 5: Human-AI Collaboration & A/B Testing
  // =========================================================================

  // -------------------------------------------------------------------------
  // Rejection Feedback
  // -------------------------------------------------------------------------

  /**
   * Get available rejection reasons for the dropdown.
   */
  getRejectionReasons(): Observable<{ reasons: RejectionReasonOption[] }> {
    return this.http.get<{ reasons: RejectionReasonOption[] }>(`${this.baseUrl}/rejection-reasons/`);
  }

  /**
   * Reject an opportunity with structured feedback.
   */
  rejectOpportunity(opportunityId: string, data: RejectionRequest): Observable<RejectionResponse> {
    return this.http.post<RejectionResponse>(
      `${this.baseUrl}/opportunities/${opportunityId}/reject/`,
      data
    );
  }

  /**
   * Get human feedback summary with recommendations.
   */
  getFeedbackSummary(): Observable<FeedbackSummary> {
    return this.http.get<FeedbackSummary>(`${this.baseUrl}/feedback-summary/`);
  }

  // -------------------------------------------------------------------------
  // A/B Testing
  // -------------------------------------------------------------------------

  /**
   * Get all A/B tests.
   */
  getABTests(): Observable<{ tests: ABTest[] }> {
    return this.http.get<{ tests: ABTest[] }>(`${this.baseUrl}/ab-tests/`);
  }

  /**
   * Create a new A/B test.
   */
  createABTest(data: ABTestCreateRequest): Observable<{ success: boolean; test_id: string; message: string }> {
    return this.http.post<{ success: boolean; test_id: string; message: string }>(
      `${this.baseUrl}/ab-tests/`,
      data
    );
  }

  /**
   * Get detailed A/B test results.
   */
  getABTestDetail(testId: string): Observable<ABTestDetail> {
    return this.http.get<ABTestDetail>(`${this.baseUrl}/ab-tests/${testId}/`);
  }

  /**
   * Perform action on A/B test (start, pause, cancel, resume).
   */
  actionABTest(testId: string, action: 'start' | 'pause' | 'cancel' | 'resume'): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/ab-tests/${testId}/`,
      { action }
    );
  }

  /**
   * Create a quick A/B test from a template.
   */
  createQuickTest(data: QuickTestRequest): Observable<{
    success: boolean;
    test_id: string;
    name: string;
    variants: string[];
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      test_id: string;
      name: string;
      variants: string[];
      message: string;
    }>(`${this.baseUrl}/ab-tests/quick/`, data);
  }

  // -------------------------------------------------------------------------
  // Tone Performance
  // -------------------------------------------------------------------------

  /**
   * Get tone performance data by subreddit.
   */
  getTonePerformance(): Observable<TonePerformanceResponse> {
    return this.http.get<TonePerformanceResponse>(`${this.baseUrl}/tone-performance/`);
  }

  // -------------------------------------------------------------------------
  // Phase 5 Helper Methods
  // -------------------------------------------------------------------------

  /**
   * Get display name for rejection reason.
   */
  getRejectionReasonLabel(reason: RejectionReasonType): string {
    const labels: Record<RejectionReasonType, string> = {
      'tone_mismatch': 'Tone Mismatch',
      'too_promotional': 'Too Promotional',
      'factually_wrong': 'Factually Wrong',
      'off_topic': 'Off Topic',
      'low_quality': 'Low Quality',
      'wrong_strategy': 'Wrong Strategy',
      'timing_bad': 'Bad Timing',
      'duplicate': 'Duplicate',
      'not_relevant': 'Not Relevant',
      'risky_subreddit': 'Risky Subreddit',
      'other': 'Other'
    };
    return labels[reason] || reason;
  }

  /**
   * Get color class for A/B test status.
   */
  getABTestStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'active': 'bg-green-100 text-green-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get icon for A/B test type.
   */
  getABTestTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'strategy': 'alt_route',
      'tone': 'record_voice_over',
      'content': 'article',
      'timing': 'schedule',
      'link': 'link',
      'custom': 'tune'
    };
    return icons[type] || 'science';
  }

  /**
   * Get display label for tone type.
   */
  getToneLabel(tone: ToneType): string {
    const labels: Record<ToneType, string> = {
      'casual': 'Casual',
      'enthusiast': 'Enthusiast',
      'helpful': 'Helpful',
      'empathetic': 'Empathetic',
      'witty': 'Witty',
      'expert': 'Expert'
    };
    return labels[tone] || tone;
  }

  /**
   * Get color for tone type (for charts).
   */
  getToneColor(tone: ToneType): string {
    const colors: Record<ToneType, string> = {
      'casual': '#60A5FA',      // blue-400
      'enthusiast': '#F59E0B',  // amber-500
      'helpful': '#10B981',     // emerald-500
      'empathetic': '#EC4899',  // pink-500
      'witty': '#8B5CF6',       // violet-500
      'expert': '#6366F1'       // indigo-500
    };
    return colors[tone] || '#9CA3AF';
  }

  /**
   * Calculate confidence level description.
   */
  getConfidenceLevel(confidence: number): { label: string; class: string } {
    if (confidence >= 0.95) {
      return { label: 'High', class: 'text-green-600' };
    } else if (confidence >= 0.80) {
      return { label: 'Medium', class: 'text-yellow-600' };
    } else {
      return { label: 'Low', class: 'text-red-600' };
    }
  }
}
