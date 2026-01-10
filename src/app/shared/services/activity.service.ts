import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerActivity, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  list(action?: string, page: number = 1): Observable<PaginatedResponse<CustomerActivity>> {
    let params = new HttpParams().set('page', page.toString());

    if (action) {
      params = params.set('action', action);
    }

    return this.http.get<PaginatedResponse<CustomerActivity>>(
      `${this.apiUrl}/activity/`,
      { params }
    );
  }
}
