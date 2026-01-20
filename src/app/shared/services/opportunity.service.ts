import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Opportunity, OpportunityListItem, OpportunityStats, PaginatedResponse } from '../models';

export interface OpportunityFilters {
  status?: string;
  is_read?: boolean;
  subreddits?: string;
  intent_tier?: string;  // comma-separated: "tier_1,tier_2"
  has_drafts?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface BulkApproval {
  opportunity_id: string;
  draft_id: number;
  edited_text?: string;
}

export interface BulkGenerateResult {
  success: boolean;
  generated_count: number;
  failed_count: number;
  results: Array<{
    opportunity_id: string;
    success: boolean;
    draft_count?: number;
    error?: string;
  }>;
}

export interface BulkApproveResult {
  success: boolean;
  approved_count: number;
  failed_count: number;
  results: Array<{
    opportunity_id: string;
    success: boolean;
    error?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  list(filters: OpportunityFilters = {}): Observable<PaginatedResponse<OpportunityListItem>> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.is_read !== undefined) {
      params = params.set('is_read', filters.is_read.toString());
    }
    if (filters.subreddits) {
      params = params.set('subreddits', filters.subreddits);
    }
    if (filters.intent_tier) {
      params = params.set('intent_tier', filters.intent_tier);
    }
    if (filters.has_drafts !== undefined) {
      params = params.set('has_drafts', filters.has_drafts.toString());
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.page_size) {
      params = params.set('page_size', filters.page_size.toString());
    }

    return this.http.get<PaginatedResponse<OpportunityListItem>>(
      `${this.apiUrl}/opportunities/`,
      { params }
    );
  }

  getStats(): Observable<OpportunityStats> {
    return this.http.get<OpportunityStats>(`${this.apiUrl}/opportunities/stats/`);
  }

  markRead(id: string): Observable<{ success: boolean; is_read: boolean }> {
    return this.http.post<{ success: boolean; is_read: boolean }>(
      `${this.apiUrl}/opportunities/${id}/read/`,
      {}
    );
  }

  bulkStatus(opportunityIds: string[], status: string): Observable<{ success: boolean; updated_count: number; status: string }> {
    return this.http.post<{ success: boolean; updated_count: number; status: string }>(
      `${this.apiUrl}/opportunities/bulk-status/`,
      { opportunity_ids: opportunityIds, status }
    );
  }

  bulkRead(opportunityIds: string[]): Observable<{ success: boolean; updated_count: number; is_read: boolean }> {
    return this.http.post<{ success: boolean; updated_count: number; is_read: boolean }>(
      `${this.apiUrl}/opportunities/bulk-read/`,
      { opportunity_ids: opportunityIds }
    );
  }

  get(id: string): Observable<Opportunity> {
    return this.http.get<Opportunity>(`${this.apiUrl}/opportunities/${id}/`);
  }

  approve(id: string, draftId: number, editedText?: string, scheduledFor?: string): Observable<{ success: boolean; status: string }> {
    const payload: any = { draft_id: draftId };
    if (editedText) {
      payload.edited_text = editedText;
    }
    if (scheduledFor) {
      payload.scheduled_for = scheduledFor;
    }
    return this.http.post<{ success: boolean; status: string }>(
      `${this.apiUrl}/opportunities/${id}/approve/`,
      payload
    );
  }

  reject(id: string): Observable<{ success: boolean; status: string }> {
    return this.http.post<{ success: boolean; status: string }>(
      `${this.apiUrl}/opportunities/${id}/reject/`,
      {}
    );
  }

  regenerate(
    id: string,
    strategy: 'engage_only' | 'soft_mention' | 'with_link',
    includeUtm: boolean = true,
    tone?: string
  ): Observable<{ success: boolean; draft: any }> {
    const payload: any = {
      strategy,
      include_utm: includeUtm
    };
    if (tone) {
      payload.tone = tone;
    }
    return this.http.post<{ success: boolean; draft: any }>(
      `${this.apiUrl}/opportunities/${id}/regenerate/`,
      payload
    );
  }

  /**
   * Bulk generate response drafts for multiple opportunities.
   */
  bulkGenerate(opportunityIds: string[]): Observable<BulkGenerateResult> {
    return this.http.post<BulkGenerateResult>(
      `${this.apiUrl}/opportunities/bulk-generate/`,
      { opportunity_ids: opportunityIds }
    );
  }

  /**
   * Bulk approve multiple opportunities with specified drafts.
   */
  bulkApprove(approvals: BulkApproval[]): Observable<BulkApproveResult> {
    return this.http.post<BulkApproveResult>(
      `${this.apiUrl}/opportunities/bulk-approve/`,
      { approvals }
    );
  }
}
