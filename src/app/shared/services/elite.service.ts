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
  StrategyStats
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
}
