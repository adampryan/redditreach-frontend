import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerSubreddit, SubredditCreate } from '../models';

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
}
