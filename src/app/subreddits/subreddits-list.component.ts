import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { SubredditService, CustomerService } from '../shared/services';
import { KeywordSuggestion } from '../shared/services/subreddit.service';
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

  // Keyword suggestions
  suggestedKeywords: string[] = [];
  selectedSuggestions: Set<string> = new Set();
  isLoadingSuggestions = false;
  suggestionReasoning = '';
  suggestionWarning: string | null = null;
  private subredditNameSubject = new Subject<string>();

  // Edit form
  editingSubreddit: CustomerSubreddit | null = null;
  editKeywords = '';
  editExcludeKeywords = '';
  editMaxResponsesPerDay = 2;
  isUpdating = false;
  editError = '';

  constructor(
    private subredditService: SubredditService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupKeywordSuggestions();
  }

  setupKeywordSuggestions(): void {
    this.subredditNameSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(name => name.length >= 3),
      switchMap(name => {
        this.isLoadingSuggestions = true;
        this.suggestedKeywords = [];
        this.suggestionReasoning = '';
        this.suggestionWarning = null;
        return this.subredditService.suggestKeywords(name);
      })
    ).subscribe({
      next: (result) => {
        this.isLoadingSuggestions = false;
        this.suggestedKeywords = result.suggestions || [];
        this.suggestionReasoning = result.reasoning || '';
        this.suggestionWarning = result.warning;
        this.selectedSuggestions.clear();
      },
      error: () => {
        this.isLoadingSuggestions = false;
        this.suggestedKeywords = [];
      }
    });
  }

  onSubredditNameChange(): void {
    let name = this.newSubredditName.trim();
    if (name.toLowerCase().startsWith('r/')) {
      name = name.substring(2);
    }
    this.subredditNameSubject.next(name);
  }

  toggleSuggestion(keyword: string): void {
    if (this.selectedSuggestions.has(keyword)) {
      this.selectedSuggestions.delete(keyword);
    } else {
      this.selectedSuggestions.add(keyword);
    }
    this.updateKeywordsFromSuggestions();
  }

  selectAllSuggestions(): void {
    this.suggestedKeywords.forEach(kw => this.selectedSuggestions.add(kw));
    this.updateKeywordsFromSuggestions();
  }

  clearSuggestions(): void {
    this.selectedSuggestions.clear();
    this.updateKeywordsFromSuggestions();
  }

  private updateKeywordsFromSuggestions(): void {
    // Merge selected suggestions with any manually entered keywords
    const manual = this.newKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k && !this.suggestedKeywords.includes(k));
    const selected = Array.from(this.selectedSuggestions);
    this.newKeywords = [...manual, ...selected].join(', ');
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
      this.suggestedKeywords = [];
      this.selectedSuggestions.clear();
      this.suggestionReasoning = '';
      this.suggestionWarning = null;
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

  startEdit(subreddit: CustomerSubreddit): void {
    this.editingSubreddit = subreddit;
    this.editKeywords = subreddit.keywords?.join(', ') || '';
    this.editExcludeKeywords = subreddit.exclude_keywords?.join(', ') || '';
    this.editMaxResponsesPerDay = subreddit.max_responses_per_day || 2;
    this.editError = '';
    this.showAddForm = false;
  }

  cancelEdit(): void {
    this.editingSubreddit = null;
    this.editKeywords = '';
    this.editExcludeKeywords = '';
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.editingSubreddit) return;

    this.isUpdating = true;
    this.editError = '';

    const updateData = {
      keywords: this.editKeywords ? this.editKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
      exclude_keywords: this.editExcludeKeywords ? this.editExcludeKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
      max_responses_per_day: this.editMaxResponsesPerDay
    };

    this.subredditService.update(this.editingSubreddit.id, updateData).subscribe({
      next: (updated) => {
        const index = this.subreddits.findIndex(s => s.id === this.editingSubreddit!.id);
        if (index >= 0) {
          this.subreddits[index] = updated;
        }
        this.isUpdating = false;
        this.cancelEdit();
      },
      error: (error) => {
        this.isUpdating = false;
        this.editError = error.error?.error || 'Failed to update subreddit';
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
