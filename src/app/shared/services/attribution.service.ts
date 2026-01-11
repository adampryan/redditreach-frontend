import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubredditStats {
  subreddit_name: string;
  subreddit_id: number;
  total_responses: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_revenue: number;
  click_rate: number;
  signup_rate: number;
  conversion_rate: number;
  posterior_conversion_rate: number;
  posterior_confidence: number;
  expected_value: number;
}

export interface AttributionTotals {
  total_responses: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_revenue: number;
  click_rate: number;
  conversion_rate: number;
}

export interface AttributionStatsResponse {
  subreddits: SubredditStats[];
  totals: AttributionTotals;
}

export interface TrackingSnippetResponse {
  customer_id: string;
  pixel_url: string;
  js_snippet: string;
  usage: {
    track_visit: string;
    track_signup: string;
    track_conversion: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AttributionService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AttributionStatsResponse> {
    return this.http.get<AttributionStatsResponse>(`${this.apiUrl}/attribution/stats/`);
  }

  getSnippet(): Observable<TrackingSnippetResponse> {
    return this.http.get<TrackingSnippetResponse>(`${this.apiUrl}/attribution/snippet/`);
  }
}
