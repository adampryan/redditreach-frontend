import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplyService } from '../shared/services';
import { CommentReply, ReplyStats } from '../shared/models';

@Component({
  selector: 'app-replies-list',
  standalone: false,
  templateUrl: './replies-list.component.html',
  styleUrls: ['./replies-list.component.scss']
})
export class RepliesListComponent implements OnInit {
  replies: CommentReply[] = [];
  stats: ReplyStats | null = null;
  isLoading = true;
  isRefreshing = false;
  currentFilter: string = 'all';  // Default to 'all' so users see all replies
  currentSort: string = 'time';
  currentSubreddits: string[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;

  filterOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'op_replies', label: 'OP Replies' },
    { value: 'needs_response', label: 'Needs Response' },
    { value: 'pending_drafts', label: 'Pending Drafts' }
  ];

  sortOptions: { value: string; label: string }[] = [
    { value: 'time', label: 'Newest First' },
    { value: '-time', label: 'Oldest First' },
    { value: 'subreddit', label: 'Subreddit A-Z' },
    { value: '-subreddit', label: 'Subreddit Z-A' },
    { value: '-score', label: 'Highest Score' },
    { value: 'score', label: 'Lowest Score' }
  ];

  constructor(
    private replyService: ReplyService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.route.queryParams.subscribe(params => {
      // Default to 'all' if no filter specified
      this.currentFilter = params['filter'] || 'all';
      this.currentSort = params['sort'] || 'time';
      // Parse subreddits - can be comma-separated string
      const subParam = params['subreddits'] || '';
      this.currentSubreddits = subParam ? subParam.split(',') : [];
      this.currentPage = parseInt(params['page'], 10) || 1;
      this.loadReplies();
    });
  }

  loadStats(): void {
    this.replyService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  loadReplies(): void {
    this.isLoading = true;

    const filters: any = {
      page: this.currentPage,
      page_size: this.pageSize,
      sort: this.currentSort
    };

    // Apply status filter (skip for 'all')
    if (this.currentFilter === 'unread') {
      filters.is_read = false;
    } else if (this.currentFilter === 'op_replies') {
      filters.is_op_reply = true;
    } else if (this.currentFilter === 'needs_response') {
      filters.requires_response = true;
    } else if (this.currentFilter === 'pending_drafts') {
      filters.has_pending_draft = true;
    }

    // Apply subreddit filter (comma-separated for multiple)
    if (this.currentSubreddits.length > 0) {
      filters.subreddits = this.currentSubreddits.join(',');
    }

    this.replyService.list(filters).subscribe({
      next: (response) => {
        this.replies = response.results;
        this.totalCount = response.count;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterBy(filter: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filter, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  sortBy(sort: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sort || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  filterBySubreddits(subreddits: string[]): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subreddits: subreddits.length > 0 ? subreddits.join(',') : null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  viewReply(id: number): void {
    this.router.navigate(['/replies', id]);
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const days = Math.floor(diffHours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  truncate(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }

  onPageChange(event: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: event.pageIndex + 1 },
      queryParamsHandling: 'merge'
    });
  }

  dismissReply(reply: CommentReply, event: Event): void {
    event.stopPropagation(); // Prevent navigation to detail page

    if (!confirm('Dismiss this reply? It will be removed from your list.')) {
      return;
    }

    this.replyService.dismiss(reply.id).subscribe({
      next: () => {
        // Remove from local array
        this.replies = this.replies.filter(r => r.id !== reply.id);
        this.totalCount--;
        // Update stats
        if (this.stats) {
          this.stats.total_replies--;
          if (!reply.is_read) {
            this.stats.unread_replies--;
          }
          if (reply.requires_response) {
            this.stats.needs_response--;
          }
        }
        this.snackBar.open('Reply dismissed', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to dismiss reply', 'Dismiss', { duration: 5000 });
      }
    });
  }

  refreshReplies(): void {
    this.isRefreshing = true;
    this.replyService.refresh().subscribe({
      next: (response) => {
        // Task is queued - show message and refresh list after a delay
        this.snackBar.open(response.message || 'Checking for new replies...', 'Close', { duration: 5000 });

        // Wait 10 seconds then refresh the list (task should be done by then)
        setTimeout(() => {
          this.isRefreshing = false;
          this.loadReplies();
          this.loadStats();
        }, 10000);
      },
      error: (err) => {
        this.isRefreshing = false;
        this.snackBar.open('Failed to refresh replies', 'Close', { duration: 5000 });
      }
    });
  }
}
