import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RegenerateDialogData {
  opportunityId: string;
  postTitle: string;
}

export interface RegenerateDialogResult {
  strategy: 'engage_only' | 'soft_mention' | 'with_link';
  includeUtm: boolean;
}

@Component({
  selector: 'app-regenerate-dialog',
  standalone: false,
  templateUrl: './regenerate-dialog.component.html',
  styleUrls: ['./regenerate-dialog.component.scss']
})
export class RegenerateDialogComponent {
  strategy: 'engage_only' | 'soft_mention' | 'with_link' = 'engage_only';
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

  constructor(
    public dialogRef: MatDialogRef<RegenerateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegenerateDialogData
  ) {}

  get showUtmOption(): boolean {
    return this.strategy === 'with_link';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onRegenerate(): void {
    const result: RegenerateDialogResult = {
      strategy: this.strategy,
      includeUtm: this.strategy === 'with_link' ? this.includeUtm : false
    };
    this.dialogRef.close(result);
  }
}
