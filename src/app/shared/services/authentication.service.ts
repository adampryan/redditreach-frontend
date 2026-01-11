import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Customer } from '../models';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface TokenRefreshResponse {
  access: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  business_name: string;
  website?: string;
}

interface RegisterResponse {
  customer: {
    id: string;
    name: string;
    email: string;
    subscription_tier: string;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private userSubject: BehaviorSubject<User | null>;
  public user$: Observable<User | null>;

  private readonly TOKEN_KEY = 'threadcatch_tokens';
  private readonly USER_KEY = 'threadcatch_user';

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    this.userSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.user$ = this.userSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    const tokens = localStorage.getItem(this.TOKEN_KEY);
    if (tokens) {
      const parsed = JSON.parse(tokens);
      return parsed.access || null;
    }
    return null;
  }

  getRefreshToken(): string | null {
    const tokens = localStorage.getItem(this.TOKEN_KEY);
    if (tokens) {
      const parsed = JSON.parse(tokens);
      return parsed.refresh || null;
    }
    return null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    // Use the main API token endpoint (not redditreach-specific)
    const tokenUrl = environment.API_BASE_URL.replace('/redditreach/api', '/api/token/');

    return this.http.post<LoginResponse>(tokenUrl, { email, password }).pipe(
      tap(response => {
        this.storeTokens(response.access, response.refresh);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.API_BASE_URL}/register/`, data).pipe(
      tap(response => {
        this.storeTokens(response.tokens.access, response.tokens.refresh);
      })
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    const tokenUrl = environment.API_BASE_URL.replace('/redditreach/api', '/api/token/refresh/');

    return this.http.post<TokenRefreshResponse>(tokenUrl, { refresh: refreshToken }).pipe(
      tap(response => {
        const tokens = JSON.parse(localStorage.getItem(this.TOKEN_KEY) || '{}');
        tokens.access = response.access;
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
      })
    );
  }

  loadUserProfile(): Observable<Customer> {
    return this.http.get<Customer>(`${environment.API_BASE_URL}/me/`).pipe(
      tap(customer => {
        const user: User = {
          id: customer.id,
          email: customer.email,
          first_name: customer.name,
          last_name: '',
          tokens: {
            access: this.getAccessToken() || '',
            refresh: this.getRefreshToken() || '',
          },
          customer
        };
        this.setUser(user);
      })
    );
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
  }

  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify({ access, refresh }));
  }
}
