import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, AuthenticationService } from '../../services';
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

  constructor(
    private customerService: CustomerService,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
