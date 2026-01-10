import { Component, OnInit } from '@angular/core';
import { SubredditService, CustomerService } from '../shared/services';
import { CustomerSubreddit, SubredditCreate, CustomerStats } from '../shared/models';

@Component({
  selector: 'app-subreddits-list',
  standalone: false,
  templateUrl: './subreddits-list.component.html',
  styleUrls: ['./subreddits-list.component.scss']
})
export class SubredditsListComponent implements OnInit {
  subreddits: CustomerSubreddit[] = [];
  stats: CustomerStats | null = null;
  isLoading = true;
  showAddForm = false;

  // Add form
  newSubredditName = '';
  newKeywords = '';
  isSubmitting = false;
  addError = '';

  constructor(
    private subredditService: SubredditService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.subredditService.list().subscribe({
      next: (subreddits) => {
        this.subreddits = subreddits;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.customerService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.addError = '';
    if (!this.showAddForm) {
      this.newSubredditName = '';
      this.newKeywords = '';
    }
  }

  addSubreddit(): void {
    if (!this.newSubredditName.trim()) {
      this.addError = 'Please enter a subreddit name';
      return;
    }

    // Clean subreddit name (remove r/ prefix if present)
    let name = this.newSubredditName.trim();
    if (name.toLowerCase().startsWith('r/')) {
      name = name.substring(2);
    }

    this.isSubmitting = true;
    this.addError = '';

    const data: SubredditCreate = {
      subreddit_name: name,
      keywords: this.newKeywords ? this.newKeywords.split(',').map(k => k.trim()).filter(k => k) : []
    };

    this.subredditService.create(data).subscribe({
      next: (subreddit) => {
        this.subreddits.push(subreddit);
        this.isSubmitting = false;
        this.toggleAddForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.addError = error.error?.error || 'Failed to add subreddit';
      }
    });
  }

  toggleActive(subreddit: CustomerSubreddit): void {
    this.subredditService.update(subreddit.id, { is_active: !subreddit.is_active }).subscribe({
      next: (updated) => {
        const index = this.subreddits.findIndex(s => s.id === subreddit.id);
        if (index >= 0) {
          this.subreddits[index] = updated;
        }
      }
    });
  }

  deleteSubreddit(subreddit: CustomerSubreddit): void {
    if (!confirm(`Are you sure you want to remove r/${subreddit.subreddit_name}?`)) {
      return;
    }

    this.subredditService.delete(subreddit.id).subscribe({
      next: () => {
        this.subreddits = this.subreddits.filter(s => s.id !== subreddit.id);
      }
    });
  }

  getLastScanned(date: string | null): string {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  }
}
