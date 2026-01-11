import { Component, OnInit } from '@angular/core';
import { AttributionService, SubredditStats, AttributionTotals, TrackingSnippetResponse } from '../shared/services';

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  isLoading = true;
  subreddits: SubredditStats[] = [];
  totals: AttributionTotals | null = null;
  snippet: TrackingSnippetResponse | null = null;
  showSnippet = false;
  snippetCopied = false;
  hasTrackingInstalled = false;

  constructor(private attributionService: AttributionService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.attributionService.getStats().subscribe({
      next: (data) => {
        this.subreddits = data.subreddits;
        this.totals = data.totals;
        // Tracking is installed if we have any clicks (snippet is working)
        this.hasTrackingInstalled = data.totals.total_clicks > 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadSnippet(): void {
    console.log('loadSnippet called');

    if (this.snippet) {
      console.log('Using cached snippet');
      this.showSnippet = true;
      return;
    }

    console.log('Fetching snippet from API...');
    this.attributionService.getSnippet().subscribe({
      next: (data) => {
        console.log('Snippet loaded:', data);
        this.snippet = data;
        this.showSnippet = true;
      },
      error: (err) => {
        console.error('Failed to load tracking snippet:', err);
        alert('Failed to load tracking snippet: ' + (err.message || err.statusText || 'Unknown error'));
      }
    });
  }

  copySnippet(): void {
    if (this.snippet) {
      navigator.clipboard.writeText(this.snippet.js_snippet).then(() => {
        this.snippetCopied = true;
        setTimeout(() => this.snippetCopied = false, 2000);
      });
    }
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 80) return 'High';
    if (confidence >= 50) return 'Medium';
    return 'Low';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  }
}
