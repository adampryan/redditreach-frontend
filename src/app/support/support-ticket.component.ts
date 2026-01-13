import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, SupportTicketDetail, SupportMessage } from '../shared/services/customer.service';

@Component({
  selector: 'app-support-ticket',
  standalone: false,
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.scss']
})
export class SupportTicketComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  ticket: SupportTicketDetail | null = null;
  isLoading = true;
  error = '';

  // Reply form
  replyMessage = '';
  isSending = false;
  sendError = '';

  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    if (ticketId) {
      this.loadTicket(ticketId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadTicket(ticketId: string): void {
    this.isLoading = true;
    this.customerService.getSupportTicket(ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        this.error = 'Failed to load ticket';
        this.isLoading = false;
      }
    });
  }

  sendReply(): void {
    if (!this.replyMessage.trim() || !this.ticket) {
      return;
    }

    this.isSending = true;
    this.sendError = '';

    this.customerService.replySupportTicket(this.ticket.id, this.replyMessage.trim()).subscribe({
      next: () => {
        this.replyMessage = '';
        this.isSending = false;
        // Reload ticket to show new message
        this.loadTicket(this.ticket!.id);
      },
      error: (err) => {
        this.isSending = false;
        this.sendError = 'Failed to send message';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/support']);
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
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
