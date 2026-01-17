import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, AuthenticationService, CustomerListItem } from '../../services';
import { Customer, CustomerStats } from '../../models';
import { SELECTED_CUSTOMER_KEY } from '../../interceptors/jwt.interceptor';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit {
  customer: Customer | null = null;
  stats: CustomerStats | null = null;
  availableCustomers: CustomerListItem[] = [];
  currentCustomerId: string | null = null;
  showCustomerDropdown = false;

  constructor(
    private customerService: CustomerService,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load current selection from localStorage
    this.currentCustomerId = localStorage.getItem(SELECTED_CUSTOMER_KEY);
    this.loadData();
    this.loadAvailableCustomers();
  }

  loadData(): void {
    this.customerService.getProfile().subscribe({
      next: (customer) => {
        this.customer = customer;
        // Store the current customer ID if not already set
        if (!this.currentCustomerId) {
          this.currentCustomerId = customer.id;
          localStorage.setItem(SELECTED_CUSTOMER_KEY, customer.id);
        }
      }
    });

    this.customerService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  loadAvailableCustomers(): void {
    this.customerService.listCustomers().subscribe({
      next: (response) => {
        this.availableCustomers = response.customers;
        // If no customer is selected yet, use the one from backend
        if (!this.currentCustomerId && response.current_customer_id) {
          this.currentCustomerId = response.current_customer_id;
          localStorage.setItem(SELECTED_CUSTOMER_KEY, response.current_customer_id);
        }
      },
      error: () => {
        // Not a multi-customer user, that's fine
        this.availableCustomers = [];
      }
    });
  }

  get hasMultipleCustomers(): boolean {
    return this.availableCustomers.length > 1;
  }

  toggleCustomerDropdown(): void {
    this.showCustomerDropdown = !this.showCustomerDropdown;
  }

  switchToCustomer(customerId: string): void {
    if (customerId === this.currentCustomerId) {
      this.showCustomerDropdown = false;
      return;
    }

    this.customerService.switchCustomer(customerId).subscribe({
      next: (response) => {
        // Store the new customer ID in localStorage
        localStorage.setItem(SELECTED_CUSTOMER_KEY, response.customer.id);
        this.currentCustomerId = response.customer.id;
        this.showCustomerDropdown = false;
        // Reload the page to get fresh data for the new customer
        window.location.reload();
      },
      error: (err) => {
        console.error('Failed to switch customer:', err);
        this.showCustomerDropdown = false;
      }
    });
  }

  logout(): void {
    // Clear customer selection on logout
    localStorage.removeItem(SELECTED_CUSTOMER_KEY);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
