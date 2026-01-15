import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RegenerateDialogData {
  opportunityId: string;
  postTitle: string;
  recommendedStrategy?: string;
  strategyReasoning?: string;
}

export interface RegenerateDialogResult {
  strategy: 'engage_only' | 'soft_mention' | 'with_link';
  tone: string;
  includeUtm: boolean;
}

@Component({
  selector: 'app-regenerate-dialog',
  standalone: false,
  templateUrl: './regenerate-dialog.component.html',
  styleUrls: ['./regenerate-dialog.component.scss']
})
export class RegenerateDialogComponent implements OnInit {
  strategy: 'engage_only' | 'soft_mention' | 'with_link' = 'engage_only';
  tone = '';
  includeUtm = true;

  strategies = [
    {
      value: 'engage_only' as const,
      label: 'Pure Engagement',
      description: 'Genuine community response with no product mention. Best for building trust and rapport.',
      icon: 'forum'
    },
    {
      value: 'soft_mention' as const,
      label: 'Soft Mention',
      description: 'Natural conversation that may mention your product by name, without a link.',
      icon: 'chat'
    },
    {
      value: 'with_link' as const,
      label: 'With Link',
      description: 'Helpful response that includes a tracked link to your product when relevant.',
      icon: 'link'
    }
  ];

  tones = [
    { value: '', label: 'Auto (based on profile)', description: 'Use your default tone from settings' },
    { value: 'casual', label: 'Casual', description: 'Conversational, like chatting with a friend' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable, genuinely supportive' },
    { value: 'witty', label: 'Witty', description: 'Clever with sharp observations or wordplay' },
    { value: 'nerdy', label: 'Nerdy', description: 'Enthusiastic geek energy with detailed knowledge' },
    { value: 'professional', label: 'Professional', description: 'Polished and business-like, but not stiff' },
    { value: 'informative', label: 'Informative', description: 'Educational, focuses on sharing knowledge' },
    { value: 'direct', label: 'Direct', description: 'Straightforward and to the point' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Excited and passionate about the topic' },
  ];

  constructor(
    public dialogRef: MatDialogRef<RegenerateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegenerateDialogData
  ) {}

  ngOnInit(): void {
    // Set default strategy based on AI recommendation
    if (this.data.recommendedStrategy) {
      const strategyMap: Record<string, 'engage_only' | 'soft_mention' | 'with_link'> = {
        'pure_engagement': 'engage_only',
        'soft_mention': 'soft_mention',
        'direct_solution': 'with_link',
        'empathy_with_solution': 'with_link',
      };
      this.strategy = strategyMap[this.data.recommendedStrategy] || 'engage_only';
    }
  }

  get showUtmOption(): boolean {
    return this.strategy === 'with_link';
  }

  get hasAiRecommendation(): boolean {
    return !!this.data.recommendedStrategy && !!this.data.strategyReasoning;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onRegenerate(): void {
    const result: RegenerateDialogResult = {
      strategy: this.strategy,
      tone: this.tone,
      includeUtm: this.strategy === 'with_link' ? this.includeUtm : false
    };
    this.dialogRef.close(result);
  }
}
