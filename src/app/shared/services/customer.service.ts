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

  // Multi-customer support
  listCustomers(): Observable<CustomerListResponse> {
    return this.http.get<CustomerListResponse>(`${this.apiUrl}/customers/`);
  }

  switchCustomer(customerId: string): Observable<CustomerSwitchResponse> {
    return this.http.post<CustomerSwitchResponse>(`${this.apiUrl}/customers/switch/`, {
      customer_id: customerId
    });
  }

  // Reddit OAuth
  getRedditConnectUrl(): Observable<{ auth_url: string }> {
    return this.http.get<{ auth_url: string }>(`${this.apiUrl}/reddit/connect/`);
  }

  disconnectReddit(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/reddit/disconnect/`, {});
  }

  // Onboarding
  completeOnboarding(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/onboarding/complete/`, {});
  }

  // Support
  submitSupportRequest(subject: string, message: string): Observable<{ success: boolean; ticket_id: string; message: string }> {
    return this.http.post<{ success: boolean; ticket_id: string; message: string }>(
      `${this.apiUrl}/support/submit/`,
      { subject, message }
    );
  }

  getSupportTickets(): Observable<{ tickets: SupportTicket[]; count: number }> {
    return this.http.get<{ tickets: SupportTicket[]; count: number }>(
      `${this.apiUrl}/support/tickets/`
    );
  }

  getSupportTicket(ticketId: string): Observable<SupportTicketDetail> {
    return this.http.get<SupportTicketDetail>(
      `${this.apiUrl}/support/tickets/${ticketId}/`
    );
  }

  replySupportTicket(ticketId: string, message: string): Observable<{ success: boolean; message_id: string }> {
    return this.http.post<{ success: boolean; message_id: string }>(
      `${this.apiUrl}/support/tickets/${ticketId}/reply/`,
      { message }
    );
  }
}

// Support ticket interfaces
export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: {
    direction: 'inbound' | 'outbound';
    preview: string;
    created_at: string;
  } | null;
  has_unread: boolean;
}

export interface SupportMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  from_name: string;
  body_text: string;
  created_at: string;
}

export interface SupportTicketDetail {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}

// Multi-customer interfaces
export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  subscription_tier: string;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  current_customer_id: string | null;
}

export interface CustomerSwitchResponse {
  success: boolean;
  customer: CustomerListItem;
}
