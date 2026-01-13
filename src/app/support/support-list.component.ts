import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, SupportTicket } from '../shared/services/customer.service';

@Component({
  selector: 'app-support-list',
  standalone: false,
  templateUrl: './support-list.component.html',
  styleUrls: ['./support-list.component.scss']
})
export class SupportListComponent implements OnInit {
  tickets: SupportTicket[] = [];
  isLoading = true;
  error = '';

  // New ticket form
  showNewTicketForm = false;
  newTicket = {
    subject: '',
    message: ''
  };
  isSubmitting = false;
  submitSuccess = false;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.customerService.getSupportTickets().subscribe({
      next: (response) => {
        this.tickets = response.tickets;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load support tickets';
        this.isLoading = false;
      }
    });
  }

  openTicket(ticket: SupportTicket): void {
    this.router.navigate(['/support', ticket.id]);
  }

  toggleNewTicketForm(): void {
    this.showNewTicketForm = !this.showNewTicketForm;
    if (!this.showNewTicketForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newTicket = { subject: '', message: '' };
    this.submitSuccess = false;
  }

  submitNewTicket(): void {
    if (!this.newTicket.subject.trim() || !this.newTicket.message.trim()) {
      return;
    }

    this.isSubmitting = true;
    this.customerService.submitSupportRequest(
      this.newTicket.subject.trim(),
      this.newTicket.message.trim()
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => {
          this.showNewTicketForm = false;
          this.resetForm();
          this.loadTickets();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'Failed to submit ticket';
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'open': 'status-open',
      'pending': 'status-pending',
      'resolved': 'status-resolved',
      'closed': 'status-closed'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'open': 'Open',
      'pending': 'Awaiting Reply',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
