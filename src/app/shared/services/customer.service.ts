import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, CustomerStats } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/me/`);
  }

  updateProfile(data: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/me/`, data);
  }

  getStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.apiUrl}/stats/`);
  }
}
