import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerSubreddit, SubredditCreate } from '../models';

export interface KeywordSuggestion {
  subreddit: string;
  suggestions: string[];
  reasoning: string;
  fit_score: number;
  warning: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SubredditService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  list(): Observable<CustomerSubreddit[]> {
    return this.http.get<CustomerSubreddit[]>(`${this.apiUrl}/subreddits/`);
  }

  get(id: number): Observable<CustomerSubreddit> {
    return this.http.get<CustomerSubreddit>(`${this.apiUrl}/subreddits/${id}/`);
  }

  create(data: SubredditCreate): Observable<CustomerSubreddit> {
    return this.http.post<CustomerSubreddit>(`${this.apiUrl}/subreddits/`, data);
  }

  update(id: number, data: Partial<CustomerSubreddit>): Observable<CustomerSubreddit> {
    return this.http.put<CustomerSubreddit>(`${this.apiUrl}/subreddits/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subreddits/${id}/`);
  }

  suggestKeywords(subredditName: string): Observable<KeywordSuggestion> {
    return this.http.post<KeywordSuggestion>(
      `${this.apiUrl}/subreddits/suggest-keywords/`,
      { subreddit_name: subredditName }
    );
  }
}
