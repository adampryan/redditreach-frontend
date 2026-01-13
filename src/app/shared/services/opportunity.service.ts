import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Opportunity, OpportunityListItem, PaginatedResponse } from '../models';

export interface OpportunityFilters {
  status?: string;
  subreddit?: string;
  page?: number;
  page_size?: number;
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
    if (filters.subreddit) {
      params = params.set('subreddit', filters.subreddit);
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
    includeUtm: boolean = true
  ): Observable<{ success: boolean; draft: any }> {
    return this.http.post<{ success: boolean; draft: any }>(
      `${this.apiUrl}/opportunities/${id}/regenerate/`,
      {
        strategy,
        include_utm: includeUtm
      }
    );
  }
}
