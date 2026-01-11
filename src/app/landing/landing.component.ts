import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  email = '';
  isSubmitting = false;
  showSuccess = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  submitWaitlist(): void {
    if (!this.email || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.http.post(`${environment.API_BASE_URL}/redditreach/waitlist/`, { email: this.email })
      .subscribe({
        next: () => {
          this.showSuccess = true;
          this.isSubmitting = false;
        },
        error: (err) => {
          this.errorMessage = 'Something went wrong. Please try again.';
          this.isSubmitting = false;
        }
      });
  }
}
