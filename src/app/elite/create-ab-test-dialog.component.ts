import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

import { EliteService } from '../shared/services/elite.service';
import { ABTestType, ABTestCreateRequest } from '../shared/models/ai-insight.model';

interface VariantConfig {
  name: string;
  config: Record<string, any>;
  isControl: boolean;
}

@Component({
  selector: 'app-create-ab-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatSliderModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-purple-500">science</mat-icon>
      Create A/B Test
    </h2>

    <mat-dialog-content class="min-w-[500px]">
      <mat-stepper #stepper linear>
        <!-- Step 1: Basic Info -->
        <mat-step [completed]="step1Valid">
          <ng-template matStepLabel>Test Details</ng-template>

          <div class="py-4 space-y-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Test Name</mat-label>
              <input matInput [(ngModel)]="testName" required
                     placeholder="e.g., Strategy Test - Tech Subreddits">
              <mat-icon matPrefix>label</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Test Type</mat-label>
              <mat-select [(ngModel)]="testType" required>
                <mat-option *ngFor="let type of testTypes" [value]="type.value">
                  <div class="flex items-center gap-2">
                    <mat-icon [class]="type.iconClass">{{ type.icon }}</mat-icon>
                    <span>{{ type.label }}</span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>category</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Description (Optional)</mat-label>
              <textarea matInput [(ngModel)]="description" rows="2"
                        placeholder="What are you trying to learn?"></textarea>
              <mat-icon matPrefix>notes</mat-icon>
            </mat-form-field>
          </div>

          <div class="flex justify-end">
            <button mat-flat-button color="primary" matStepperNext [disabled]="!step1Valid">
              Next
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </mat-step>

        <!-- Step 2: Variants -->
        <mat-step [completed]="step2Valid">
          <ng-template matStepLabel>Variants</ng-template>

          <div class="py-4">
            <p class="text-sm text-gray-600 mb-4">
              Define the variants you want to test. One must be marked as control.
            </p>

            <!-- Variant Cards -->
            <div class="space-y-3 mb-4">
              <div *ngFor="let variant of variants; let i = index"
                   class="border rounded-lg p-4"
                   [ngClass]="variant.isControl ? 'border-blue-300 bg-blue-50' : 'border-gray-200'">
                <div class="flex items-start gap-3">
                  <mat-checkbox [(ngModel)]="variant.isControl"
                                (change)="onControlChange(i)"
                                class="mt-2">
                    Control
                  </mat-checkbox>

                  <div class="flex-1 space-y-2">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Variant Name</mat-label>
                      <input matInput [(ngModel)]="variant.name" required
                             placeholder="e.g., Direct Approach">
                    </mat-form-field>

                    <!-- Dynamic config based on test type -->
                    <ng-container [ngSwitch]="testType">
                      <!-- Strategy Test -->
                      <mat-form-field *ngSwitchCase="'strategy'" appearance="outline" class="w-full">
                        <mat-label>Response Strategy</mat-label>
                        <mat-select [(ngModel)]="variant.config['strategy']">
                          <mat-option value="direct_solution">Direct Solution</mat-option>
                          <mat-option value="empathy_with_solution">Empathy + Solution</mat-option>
                          <mat-option value="soft_mention">Soft Mention</mat-option>
                          <mat-option value="pure_engagement">Pure Engagement</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Tone Test -->
                      <mat-form-field *ngSwitchCase="'tone'" appearance="outline" class="w-full">
                        <mat-label>Response Tone</mat-label>
                        <mat-select [(ngModel)]="variant.config['tone']">
                          <mat-option value="casual">Casual</mat-option>
                          <mat-option value="enthusiast">Enthusiast</mat-option>
                          <mat-option value="helpful">Helpful</mat-option>
                          <mat-option value="empathetic">Empathetic</mat-option>
                          <mat-option value="witty">Witty</mat-option>
                          <mat-option value="expert">Expert</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Link Test -->
                      <mat-form-field *ngSwitchCase="'link'" appearance="outline" class="w-full">
                        <mat-label>Link Placement</mat-label>
                        <mat-select [(ngModel)]="variant.config['link_style']">
                          <mat-option value="inline">Inline Link</mat-option>
                          <mat-option value="signature">Signature Link</mat-option>
                          <mat-option value="none">No Link</mat-option>
                          <mat-option value="contextual">Contextual (when asked)</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Timing Test -->
                      <mat-form-field *ngSwitchCase="'timing'" appearance="outline" class="w-full">
                        <mat-label>Response Timing</mat-label>
                        <mat-select [(ngModel)]="variant.config['timing']">
                          <mat-option value="immediate">Immediate (< 1 hour)</mat-option>
                          <mat-option value="quick">Quick (1-4 hours)</mat-option>
                          <mat-option value="delayed">Delayed (4-12 hours)</mat-option>
                          <mat-option value="next_day">Next Day (12-24 hours)</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Content Test -->
                      <mat-form-field *ngSwitchCase="'content'" appearance="outline" class="w-full">
                        <mat-label>Content Style</mat-label>
                        <mat-select [(ngModel)]="variant.config['content_style']">
                          <mat-option value="brief">Brief (1-2 sentences)</mat-option>
                          <mat-option value="standard">Standard (3-4 sentences)</mat-option>
                          <mat-option value="detailed">Detailed (5+ sentences)</mat-option>
                          <mat-option value="story">Story-based</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Custom Test -->
                      <mat-form-field *ngSwitchCase="'custom'" appearance="outline" class="w-full">
                        <mat-label>Custom Config (JSON)</mat-label>
                        <textarea matInput [(ngModel)]="variant.config['custom_json']" rows="2"
                                  placeholder='{"key": "value"}'></textarea>
                      </mat-form-field>
                    </ng-container>
                  </div>

                  <button mat-icon-button color="warn" (click)="removeVariant(i)"
                          *ngIf="variants.length > 2" class="mt-2">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <button mat-stroked-button (click)="addVariant()" *ngIf="variants.length < 4">
              <mat-icon>add</mat-icon>
              Add Variant
            </button>
          </div>

          <div class="flex justify-between">
            <button mat-button matStepperPrevious>
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <button mat-flat-button color="primary" matStepperNext [disabled]="!step2Valid">
              Next
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </mat-step>

        <!-- Step 3: Targeting -->
        <mat-step [completed]="step3Valid">
          <ng-template matStepLabel>Targeting</ng-template>

          <div class="py-4 space-y-4">
            <div>
              <label class="text-sm text-gray-700 mb-2 block">Target Subreddits (optional)</label>
              <mat-chip-grid #subredditGrid>
                <mat-chip-row *ngFor="let sub of targetSubreddits"
                              (removed)="removeSubreddit(sub)">
                  r/{{ sub }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip-row>
              </mat-chip-grid>
              <input placeholder="Add subreddit..."
                     [matChipInputFor]="subredditGrid"
                     [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                     (matChipInputTokenEnd)="addSubreddit($event)">
              <p class="text-xs text-gray-500 mt-1">Leave empty to apply to all subreddits</p>
            </div>

            <div>
              <label class="text-sm text-gray-700 mb-2 block">Target Intent Tiers</label>
              <div class="flex flex-wrap gap-2">
                <mat-checkbox *ngFor="let tier of intentTiers"
                              [(ngModel)]="tier.selected">
                  {{ tier.label }}
                </mat-checkbox>
              </div>
              <p class="text-xs text-gray-500 mt-1">Select which intent tiers to include</p>
            </div>

            <div>
              <label class="text-sm text-gray-700 mb-2 block">
                Traffic Percentage: {{ trafficPercentage }}%
              </label>
              <mat-slider min="10" max="100" step="10" class="w-full">
                <input matSliderThumb [(ngModel)]="trafficPercentage">
              </mat-slider>
              <p class="text-xs text-gray-500">
                Percentage of matching opportunities to include in test
              </p>
            </div>

            <div>
              <label class="text-sm text-gray-700 mb-2 block">
                Minimum Sample Size per Variant: {{ minSampleSize }}
              </label>
              <mat-slider min="10" max="200" step="10" class="w-full">
                <input matSliderThumb [(ngModel)]="minSampleSize">
              </mat-slider>
              <p class="text-xs text-gray-500">
                Test will auto-complete when all variants reach this sample size
              </p>
            </div>
          </div>

          <div class="flex justify-between">
            <button mat-button matStepperPrevious>
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <button mat-flat-button color="primary" matStepperNext [disabled]="!step3Valid">
              Review
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </mat-step>

        <!-- Step 4: Review & Create -->
        <mat-step>
          <ng-template matStepLabel>Review</ng-template>

          <div class="py-4">
            <div class="bg-gray-50 rounded-lg p-4 space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Test Name:</span>
                <span class="font-medium">{{ testName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Type:</span>
                <span class="font-medium capitalize">{{ testType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Variants:</span>
                <span class="font-medium">{{ variants.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Target Subreddits:</span>
                <span class="font-medium">{{ targetSubreddits.length || 'All' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Traffic:</span>
                <span class="font-medium">{{ trafficPercentage }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Min Samples:</span>
                <span class="font-medium">{{ minSampleSize }} per variant</span>
              </div>
            </div>

            <!-- Variant Summary -->
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Variants:</h4>
              <div class="space-y-2">
                <div *ngFor="let variant of variants"
                     class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded">
                  <mat-icon *ngIf="variant.isControl" class="text-blue-500 text-sm">verified</mat-icon>
                  <span class="font-medium">{{ variant.name }}</span>
                  <span class="text-gray-500 text-sm">
                    ({{ getVariantConfigSummary(variant) }})
                  </span>
                </div>
              </div>
            </div>

            <!-- Info Note -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div class="flex items-start gap-2">
                <mat-icon class="text-blue-500 text-lg">info</mat-icon>
                <div class="text-xs text-blue-700">
                  <strong>Test will start in Draft mode.</strong> You can review and start it
                  from the A/B Tests dashboard. The test will auto-complete when statistical
                  significance is reached.
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <button mat-button matStepperPrevious>
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <button mat-flat-button color="primary" (click)="createTest()" [disabled]="isSubmitting">
              <mat-spinner *ngIf="isSubmitting" diameter="20" class="inline-block mr-2"></mat-spinner>
              {{ isSubmitting ? 'Creating...' : 'Create Test' }}
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-content {
      max-height: 75vh;
    }
    ::ng-deep .mat-horizontal-stepper-header-container {
      margin-bottom: 16px;
    }
  `]
})
export class CreateABTestDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  testName = '';
  testType: ABTestType = 'strategy';
  description = '';

  variants: VariantConfig[] = [
    { name: 'Control', config: {}, isControl: true },
    { name: 'Variant B', config: {}, isControl: false }
  ];

  targetSubreddits: string[] = [];
  intentTiers = [
    { value: 'tier_1', label: 'Tier 1 (Active Seeking)', selected: true },
    { value: 'tier_2', label: 'Tier 2 (Pain Expression)', selected: true },
    { value: 'tier_3', label: 'Tier 3 (Implicit Need)', selected: false },
    { value: 'tier_4', label: 'Tier 4 (Engagement Only)', selected: false }
  ];
  trafficPercentage = 100;
  minSampleSize = 50;

  isSubmitting = false;
  separatorKeyCodes = [ENTER, COMMA];

  testTypes = [
    { value: 'strategy', label: 'Response Strategy', icon: 'alt_route', iconClass: 'text-purple-500' },
    { value: 'tone', label: 'Response Tone', icon: 'record_voice_over', iconClass: 'text-blue-500' },
    { value: 'content', label: 'Content Style', icon: 'article', iconClass: 'text-green-500' },
    { value: 'timing', label: 'Response Timing', icon: 'schedule', iconClass: 'text-orange-500' },
    { value: 'link', label: 'Link Placement', icon: 'link', iconClass: 'text-pink-500' },
    { value: 'custom', label: 'Custom Test', icon: 'tune', iconClass: 'text-gray-500' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateABTestDialogComponent>,
    private eliteService: EliteService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get step1Valid(): boolean {
    return !!this.testName.trim() && !!this.testType;
  }

  get step2Valid(): boolean {
    const hasControl = this.variants.some(v => v.isControl);
    const allNamed = this.variants.every(v => v.name.trim());
    return this.variants.length >= 2 && hasControl && allNamed;
  }

  get step3Valid(): boolean {
    return true; // All targeting is optional
  }

  onControlChange(index: number): void {
    // Only one control allowed
    if (this.variants[index].isControl) {
      this.variants.forEach((v, i) => {
        if (i !== index) v.isControl = false;
      });
    }
  }

  addVariant(): void {
    const letter = String.fromCharCode(65 + this.variants.length); // B, C, D
    this.variants.push({
      name: `Variant ${letter}`,
      config: {},
      isControl: false
    });
  }

  removeVariant(index: number): void {
    this.variants.splice(index, 1);
    // Ensure at least one control
    if (!this.variants.some(v => v.isControl)) {
      this.variants[0].isControl = true;
    }
  }

  addSubreddit(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().replace(/^r\//, '');
    if (value && !this.targetSubreddits.includes(value)) {
      this.targetSubreddits.push(value);
    }
    event.chipInput?.clear();
  }

  removeSubreddit(sub: string): void {
    const index = this.targetSubreddits.indexOf(sub);
    if (index >= 0) {
      this.targetSubreddits.splice(index, 1);
    }
  }

  getVariantConfigSummary(variant: VariantConfig): string {
    const config = variant.config;
    switch (this.testType) {
      case 'strategy':
        return config['strategy'] || 'Not set';
      case 'tone':
        return config['tone'] || 'Not set';
      case 'link':
        return config['link_style'] || 'Not set';
      case 'timing':
        return config['timing'] || 'Not set';
      case 'content':
        return config['content_style'] || 'Not set';
      case 'custom':
        return 'Custom config';
      default:
        return 'Config';
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  createTest(): void {
    if (!this.step1Valid || !this.step2Valid) return;

    this.isSubmitting = true;

    const selectedTiers = this.intentTiers
      .filter(t => t.selected)
      .map(t => t.value);

    const request: ABTestCreateRequest = {
      name: this.testName.trim(),
      test_type: this.testType,
      variants: this.variants.map(v => ({
        name: v.name,
        config: v.config,
        is_control: v.isControl
      })),
      target_subreddits: this.targetSubreddits.length > 0 ? this.targetSubreddits : undefined,
      target_intent_tiers: selectedTiers.length > 0 ? selectedTiers : undefined,
      min_sample_size: this.minSampleSize,
      traffic_percentage: this.trafficPercentage
    };

    this.eliteService.createABTest(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dialogRef.close({
            success: true,
            testId: response.test_id,
            message: response.message
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to create A/B test:', err);
        }
      });
  }
}
