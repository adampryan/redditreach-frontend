import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CustomerService } from '../shared/services/customer.service';
import { SubredditService } from '../shared/services/subreddit.service';
import { AuthenticationService } from '../shared/services/authentication.service';

@Component({
  selector: 'app-onboarding',
  standalone: false,
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;
  isLoading = false;

  // Step 1: Business Info
  businessForm!: FormGroup;

  // Step 2: Subreddit
  subredditForm!: FormGroup;
  popularSubreddits = [
    { name: 'entrepreneur', description: 'Startup and business discussions' },
    { name: 'smallbusiness', description: 'Small business owners community' },
    { name: 'SaaS', description: 'Software as a Service discussions' },
    { name: 'startups', description: 'Startup founders and enthusiasts' },
    { name: 'marketing', description: 'Marketing strategies and tips' },
    { name: 'Entrepreneur', description: 'Business and entrepreneurship' },
    { name: 'webdev', description: 'Web development community' },
    { name: 'programming', description: 'General programming discussions' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private customerService: CustomerService,
    private subredditService: SubredditService,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadExistingData();
  }

  initForms(): void {
    this.businessForm = this.fb.group({
      product_description: ['', [Validators.required, Validators.minLength(20)]],
      target_audience: ['', [Validators.required, Validators.minLength(10)]],
      website: [''],
      link_display_name: ['']
    });

    this.subredditForm = this.fb.group({
      subreddit_name: ['', [Validators.required, Validators.minLength(2)]],
      keywords: ['']
    });
  }

  loadExistingData(): void {
    const user = this.authService.currentUser;
    if (user?.customer) {
      this.businessForm.patchValue({
        product_description: user.customer.product_description || '',
        target_audience: user.customer.target_audience || '',
        website: user.customer.website || '',
        link_display_name: user.customer.link_display_name || ''
      });
    }
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      this.saveBusinessInfo();
    } else if (this.currentStep === 2) {
      this.addSubreddit();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  saveBusinessInfo(): void {
    if (this.businessForm.invalid) {
      Object.keys(this.businessForm.controls).forEach(key => {
        this.businessForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.customerService.updateProfile(this.businessForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 2;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error('Failed to save business info. Please try again.');
      }
    });
  }

  selectSubreddit(name: string): void {
    this.subredditForm.patchValue({ subreddit_name: name });
  }

  addSubreddit(): void {
    if (this.subredditForm.invalid) {
      this.subredditForm.get('subreddit_name')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.subredditForm.value;

    // Parse keywords into array
    const keywords = formData.keywords
      ? formData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
      : [];

    this.subredditService.create({
      subreddit_name: formData.subreddit_name.replace(/^r\//, ''),
      keywords: keywords,
      exclude_keywords: [],
      min_post_score: 1,
      max_post_age_hours: 24,
      max_responses_per_day: 3,
      cooldown_hours: 4
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 3;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.subreddit_name) {
          this.toastr.error(err.error.subreddit_name[0] || 'Invalid subreddit');
        } else {
          this.toastr.error('Failed to add subreddit. Please try again.');
        }
      }
    });
  }

  completeOnboarding(): void {
    this.isLoading = true;
    this.customerService.completeOnboarding().subscribe({
      next: () => {
        // Reload user profile to update is_onboarded flag
        this.authService.loadUserProfile().subscribe({
          next: () => {
            this.toastr.success('Setup complete! Welcome to ThreadCatch.');
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: () => {
        // Even if marking onboarded fails, let them proceed
        this.router.navigate(['/dashboard']);
      }
    });
  }

  skipOnboarding(): void {
    this.customerService.completeOnboarding().subscribe({
      next: () => {
        this.authService.loadUserProfile().subscribe();
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  get productDescription() { return this.businessForm.get('product_description'); }
  get targetAudience() { return this.businessForm.get('target_audience'); }
  get subredditName() { return this.subredditForm.get('subreddit_name'); }
}
