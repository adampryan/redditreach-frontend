import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Try to refresh token
          if (!this.isRefreshing && this.authService.getRefreshToken()) {
            this.isRefreshing = true;
            return this.authService.refreshToken().pipe(
              switchMap(() => {
                this.isRefreshing = false;
                // Retry the request with new token
                const token = this.authService.getAccessToken();
                const clonedRequest = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`
                  }
                });
                return next.handle(clonedRequest);
              }),
              catchError((refreshError) => {
                this.isRefreshing = false;
                this.authService.logout();
                this.router.navigate(['/auth/login'], {
                  queryParams: { sessionExpired: true }
                });
                return throwError(() => refreshError);
              })
            );
          } else {
            this.authService.logout();
            this.router.navigate(['/auth/login'], {
              queryParams: { sessionExpired: true }
            });
          }
        } else if (error.status === 403) {
          this.toastr.error('You do not have permission to perform this action.');
        } else if (error.status === 404) {
          this.toastr.error('Resource not found.');
        } else if (error.status >= 500) {
          this.toastr.error('Server error. Please try again later.');
        } else {
          const message = this.extractErrorMessage(error);
          if (message) {
            this.toastr.error(message);
          }
        }

        return throwError(() => error);
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.detail) {
        return error.error.detail;
      }
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.error) {
        return error.error.error;
      }
    }
    return error.message || 'An error occurred';
  }
}
