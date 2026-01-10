import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../shared/services';
import { Customer } from '../shared/models';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  customer: Customer | null = null;
  isLoading = true;
  isSaving = false;
  saveSuccess = false;
  saveError = '';

  // Reddit OAuth
  isConnectingReddit = false;
  isDisconnectingReddit = false;
  redditMessage = '';
  redditError = '';

  // Form fields
  form = {
    name: '',
    website: '',
    product_description: '',
    target_audience: '',
    tone_preferences: '',
    things_to_avoid: '',
    example_response: '',
    keywords: '',
    negative_keywords: '',
    link_display_name: ''
  };

  constructor(
    private customerService: CustomerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.handleOAuthCallback();
  }

  handleOAuthCallback(): void {
    this.route.queryParams.subscribe(params => {
      if (params['reddit_connected'] === 'true') {
        this.redditMessage = `Successfully connected Reddit account: u/${params['reddit_username'] || 'unknown'}`;
        this.loadProfile(); // Reload to get updated reddit_connected status
      }
      if (params['reddit_error']) {
        this.redditError = `Failed to connect Reddit: ${params['reddit_error'].replace(/_/g, ' ')}`;
      }
    });
  }

  loadProfile(): void {
    this.isLoading = true;
    this.customerService.getProfile().subscribe({
      next: (customer) => {
        this.customer = customer;
        this.form = {
          name: customer.name || '',
          website: customer.website || '',
          product_description: customer.product_description || '',
          target_audience: customer.target_audience || '',
          tone_preferences: customer.tone_preferences || '',
          things_to_avoid: customer.things_to_avoid || '',
          example_response: customer.example_response || '',
          keywords: (customer.keywords || []).join(', '),
          negative_keywords: (customer.negative_keywords || []).join(', '),
          link_display_name: customer.link_display_name || ''
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveSettings(): void {
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = '';

    const data: Partial<Customer> = {
      name: this.form.name,
      website: this.form.website,
      product_description: this.form.product_description,
      target_audience: this.form.target_audience,
      tone_preferences: this.form.tone_preferences,
      things_to_avoid: this.form.things_to_avoid,
      example_response: this.form.example_response,
      keywords: this.form.keywords.split(',').map(k => k.trim()).filter(k => k),
      negative_keywords: this.form.negative_keywords.split(',').map(k => k.trim()).filter(k => k),
      link_display_name: this.form.link_display_name
    };

    this.customerService.updateProfile(data).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (error) => {
        this.isSaving = false;
        this.saveError = error.error?.error || 'Failed to save settings';
      }
    });
  }

  getTierName(tier: string): string {
    const names: Record<string, string> = {
      trial: 'Trial',
      starter: 'Starter',
      growth: 'Growth',
      scale: 'Scale',
      agency: 'Agency'
    };
    return names[tier] || tier;
  }

  connectReddit(): void {
    this.isConnectingReddit = true;
    this.redditError = '';
    this.redditMessage = '';

    this.customerService.getRedditConnectUrl().subscribe({
      next: (response) => {
        // Redirect to Reddit OAuth
        window.location.href = response.auth_url;
      },
      error: (error) => {
        this.isConnectingReddit = false;
        this.redditError = error.error?.error || 'Failed to start Reddit connection';
      }
    });
  }

  disconnectReddit(): void {
    if (!confirm('Are you sure you want to disconnect your Reddit account?')) {
      return;
    }

    this.isDisconnectingReddit = true;
    this.redditError = '';
    this.redditMessage = '';

    this.customerService.disconnectReddit().subscribe({
      next: () => {
        this.isDisconnectingReddit = false;
        this.redditMessage = 'Reddit account disconnected';
        this.loadProfile(); // Reload to get updated status
      },
      error: (error) => {
        this.isDisconnectingReddit = false;
        this.redditError = error.error?.error || 'Failed to disconnect Reddit';
      }
    });
  }
}
