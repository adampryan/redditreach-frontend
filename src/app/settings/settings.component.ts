import { Component, OnInit } from '@angular/core';
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
  apiKeyCopied = false;

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
    link_display_name: '',
    // Notification preferences
    email_notifications_enabled: true,
    notify_on_opportunities: true,
    notify_on_responses_ready: true,
    notification_frequency: 'daily' as 'instant' | 'daily' | 'weekly'
  };

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadProfile();
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
          link_display_name: customer.link_display_name || '',
          // Notification preferences
          email_notifications_enabled: customer.email_notifications_enabled ?? true,
          notify_on_opportunities: customer.notify_on_opportunities ?? true,
          notify_on_responses_ready: customer.notify_on_responses_ready ?? true,
          notification_frequency: customer.notification_frequency || 'daily'
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
      link_display_name: this.form.link_display_name,
      // Notification preferences
      email_notifications_enabled: this.form.email_notifications_enabled,
      notify_on_opportunities: this.form.notify_on_opportunities,
      notify_on_responses_ready: this.form.notify_on_responses_ready,
      notification_frequency: this.form.notification_frequency
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

  copyApiKey(inputElement: HTMLInputElement): void {
    inputElement.select();
    navigator.clipboard.writeText(inputElement.value).then(() => {
      this.apiKeyCopied = true;
      setTimeout(() => this.apiKeyCopied = false, 2000);
    });
  }
}
