import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CommentReply,
  CommentReplyDetail,
  ReplyStats,
  ReplyDraft,
  GenerationOptions,
  PaginatedResponse
} from '../models';

export interface ReplyFilters {
  is_read?: boolean;
  requires_response?: boolean;
  page?: number;
  page_size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReplyService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of replies to our comments.
   */
  list(filters: ReplyFilters = {}): Observable<PaginatedResponse<CommentReply>> {
    let params = new HttpParams();

    if (filters.is_read !== undefined) {
      params = params.set('is_read', filters.is_read.toString());
    }
    if (filters.requires_response !== undefined) {
      params = params.set('requires_response', filters.requires_response.toString());
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.page_size) {
      params = params.set('page_size', filters.page_size.toString());
    }

    return this.http.get<PaginatedResponse<CommentReply>>(
      `${this.apiUrl}/replies/`,
      { params }
    );
  }

  /**
   * Get summary statistics for replies.
   */
  getStats(): Observable<ReplyStats> {
    return this.http.get<ReplyStats>(`${this.apiUrl}/replies/stats/`);
  }

  /**
   * Get detailed reply with context and drafts.
   */
  get(id: number): Observable<CommentReplyDetail> {
    return this.http.get<CommentReplyDetail>(`${this.apiUrl}/replies/${id}/`);
  }

  /**
   * Mark a reply as read.
   */
  markRead(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/replies/${id}/read/`,
      {}
    );
  }

  /**
   * Flag/unflag a reply as requiring response.
   */
  flagForResponse(id: number, requiresResponse: boolean): Observable<{ success: boolean; requires_response: boolean }> {
    return this.http.post<{ success: boolean; requires_response: boolean }>(
      `${this.apiUrl}/replies/${id}/flag/`,
      { requires_response: requiresResponse }
    );
  }

  /**
   * Create a manual draft for a reply.
   */
  createDraft(replyId: number, responseText: string): Observable<{ success: boolean; draft: ReplyDraft }> {
    return this.http.post<{ success: boolean; draft: ReplyDraft }>(
      `${this.apiUrl}/replies/${replyId}/draft/`,
      { response_text: responseText }
    );
  }

  /**
   * Generate an AI draft with strategy and tone options.
   */
  generateDraft(
    replyId: number,
    strategy: string,
    tone: string
  ): Observable<{ success: boolean; draft: ReplyDraft }> {
    return this.http.post<{ success: boolean; draft: ReplyDraft }>(
      `${this.apiUrl}/replies/${replyId}/generate/`,
      { strategy, tone }
    );
  }

  /**
   * Update an existing draft.
   */
  updateDraft(draftId: number, responseText: string): Observable<{ success: boolean; draft: ReplyDraft }> {
    return this.http.put<{ success: boolean; draft: ReplyDraft }>(
      `${this.apiUrl}/reply-drafts/${draftId}/`,
      { response_text: responseText }
    );
  }

  /**
   * Approve a draft for posting.
   */
  approveDraft(draftId: number): Observable<{ success: boolean; draft_id: number; status: string }> {
    return this.http.post<{ success: boolean; draft_id: number; status: string }>(
      `${this.apiUrl}/reply-drafts/${draftId}/approve/`,
      {}
    );
  }

  /**
   * Delete a draft.
   */
  deleteDraft(draftId: number): Observable<{ success: boolean; deleted_draft_id: number }> {
    return this.http.delete<{ success: boolean; deleted_draft_id: number }>(
      `${this.apiUrl}/reply-drafts/${draftId}/delete/`
    );
  }

  /**
   * Dismiss a reply (remove from list, no intention to respond).
   */
  dismiss(replyId: number): Observable<{ success: boolean; reply_id: number }> {
    return this.http.post<{ success: boolean; reply_id: number }>(
      `${this.apiUrl}/replies/${replyId}/dismiss/`,
      {}
    );
  }

  /**
   * Get available strategy and tone options.
   */
  getGenerationOptions(): Observable<GenerationOptions> {
    return this.http.get<GenerationOptions>(`${this.apiUrl}/generation-options/`);
  }
}
