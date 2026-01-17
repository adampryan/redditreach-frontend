import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../../environments/environment';

// Key for storing selected customer ID in localStorage
export const SELECTED_CUSTOMER_KEY = 'threadcatch_selected_customer';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthenticationService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();
    const isApiUrl = request.url.includes(environment.API_BASE_URL) ||
                     request.url.includes('/api/token');

    if (token && isApiUrl) {
      const headers: { [key: string]: string } = {
        Authorization: `Bearer ${token}`
      };

      // Add X-Customer-ID header if a customer is selected
      const selectedCustomerId = localStorage.getItem(SELECTED_CUSTOMER_KEY);
      if (selectedCustomerId) {
        headers['X-Customer-ID'] = selectedCustomerId;
      }

      request = request.clone({ setHeaders: headers });
    }

    return next.handle(request);
  }
}
