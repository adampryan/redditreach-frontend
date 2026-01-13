import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReplyService } from '../shared/services';
import { GenerationOptions } from '../shared/models';

export interface GenerateReplyDialogData {
  replyId: number;
  replyBody: string;
}

export interface GenerateReplyDialogResult {
  strategy: string;
  tone: string;
}

@Component({
  selector: 'app-generate-reply-dialog',
  standalone: false,
  templateUrl: './generate-reply-dialog.component.html',
  styleUrls: ['./generate-reply-dialog.component.scss']
})
export class GenerateReplyDialogComponent implements OnInit {
  strategy = 'engage';
  tone = 'casual';
  isLoading = true;

  strategies: { value: string; label: string; description: string; icon: string }[] = [];
  tones: { value: string; label: string; description: string }[] = [];

  private strategyIcons: Record<string, string> = {
    engage: 'forum',
    soft: 'chat',
    link: 'link',
    thanks: 'thumb_up',
    clarify: 'help_outline',
    defend: 'shield'
  };

  constructor(
    public dialogRef: MatDialogRef<GenerateReplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GenerateReplyDialogData,
    private replyService: ReplyService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    this.replyService.getGenerationOptions().subscribe({
      next: (options: GenerationOptions) => {
        // Convert strategies to array
        this.strategies = Object.entries(options.reply_strategies).map(([value, desc]) => ({
          value,
          label: this.formatLabel(value),
          description: desc as string,
          icon: this.strategyIcons[value] || 'chat'
        }));

        // Convert tones to array
        this.tones = Object.entries(options.tones).map(([value, desc]) => ({
          value,
          label: this.formatLabel(value),
          description: desc as string
        }));

        this.isLoading = false;
      },
      error: () => {
        // Fallback to defaults
        this.strategies = [
          { value: 'engage', label: 'Engage', description: 'Continue the conversation naturally', icon: 'forum' },
          { value: 'soft', label: 'Soft Mention', description: 'Natural reference to product if relevant', icon: 'chat' },
          { value: 'thanks', label: 'Thank Them', description: 'Express gratitude and continue positively', icon: 'thumb_up' }
        ];
        this.tones = [
          { value: 'casual', label: 'Casual', description: 'Like chatting with a friend' },
          { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
          { value: 'professional', label: 'Professional', description: 'Polished and business-like' }
        ];
        this.isLoading = false;
      }
    });
  }

  private formatLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onGenerate(): void {
    const result: GenerateReplyDialogResult = {
      strategy: this.strategy,
      tone: this.tone
    };
    this.dialogRef.close(result);
  }
}
