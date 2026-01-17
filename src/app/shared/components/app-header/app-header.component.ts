import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, AuthenticationService, CustomerListItem } from '../../services';
import { Customer, CustomerStats } from '../../models';

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
    this.loadData();
    this.loadAvailableCustomers();
  }

  loadData(): void {
    this.customerService.getProfile().subscribe({
      next: (customer) => {
        this.customer = customer;
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
        this.currentCustomerId = response.current_customer_id;
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
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
