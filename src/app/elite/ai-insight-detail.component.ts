import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { EliteService } from '../shared/services/elite.service';
import { AIInsightDetail, ActionOption } from '../shared/models/ai-insight.model';

@Component({
  selector: 'app-ai-insight-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './ai-insight-detail.component.html',
  styleUrls: ['./ai-insight-detail.component.scss']
})
export class AiInsightDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  insight: AIInsightDetail | null = null;
  loading = true;
  submitting = false;

  selectedAction = '';
  feedback = '';

  constructor(
    public eliteService: EliteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadInsight(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsight(id: string): void {
    this.loading = true;
    this.eliteService.getInsightDetail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (insight) => {
          this.insight = insight;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/elite/insights']);
        }
      });
  }

  selectAction(actionKey: string): void {
    this.selectedAction = actionKey;
  }

  submitAction(): void {
    if (!this.insight || !this.selectedAction) return;

    this.submitting = true;
    this.eliteService.actionInsight(this.insight.id, this.selectedAction, this.feedback)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.loadInsight(this.insight!.id);
        },
        error: () => {
          this.submitting = false;
        }
      });
  }

  dismiss(): void {
    if (!this.insight) return;

    this.eliteService.dismissInsight(this.insight.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/elite/insights']);
        }
      });
  }

  hasData(data: Record<string, any>): boolean {
    return data && Object.keys(data).length > 0;
  }
}
