import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EliteDashboardComponent } from './elite-dashboard.component';
import { EliteService } from '../shared/services/elite.service';
import { of } from 'rxjs';

describe('EliteDashboardComponent', () => {
  let component: EliteDashboardComponent;
  let fixture: ComponentFixture<EliteDashboardComponent>;
  let eliteServiceSpy: jasmine.SpyObj<EliteService>;

  const mockDashboardData = {
    intent_distribution: {
      tier_1: 10,
      tier_2: 20,
      tier_3: 15,
      tier_4: 5
    },
    metrics: {
      total_opportunities: 50,
      posted_responses: 30,
      tier_1_2_rate: 0.6,
      success_rate: 0.25,
      total_clicks: 100,
      total_conversions: 5
    },
    pending_insights: [],
    top_subreddits: [
      {
        name: 'testsubreddit',
        expected_value: 10.5,
        conversion_rate: 0.05,
        total_responses: 20,
        approval_rate: 0.8
      }
    ],
    recent_outcomes: [
      {
        opportunity_id: '12345678-1234-1234-1234-123456789012',
        subreddit: 'baseballcards',
        post_title: 'Looking for vintage cards from the 1980s',
        success_type: 'click',
        clicks: 3,
        reply_sentiment: 'positive',
        created_at: '2025-01-14T10:00:00Z'
      },
      {
        opportunity_id: '87654321-4321-4321-4321-210987654321',
        subreddit: 'pokemontcg',
        post_title: 'Best way to store my collection safely and protect from damage over time',
        success_type: 'signup',
        clicks: 5,
        reply_sentiment: 'neutral',
        created_at: '2025-01-13T15:30:00Z'
      }
    ]
  };

  const mockInsightStats = {
    total: 10,
    new: 3,
    high_priority: 2,
    pending_action: 4,
    by_type: {
      pattern: 2,
      recommendation: 3,
      question: 1,
      alert: 2,
      performance: 1,
      learning: 1
    }
  };

  const mockPatterns = {
    patterns: []
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('EliteService', [
      'getEliteDashboard',
      'getInsightStats',
      'getConversionPatterns',
      'dismissInsight',
      'getInsightTypeIcon'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        EliteDashboardComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: EliteService, useValue: spy }
      ]
    }).compileComponents();

    eliteServiceSpy = TestBed.inject(EliteService) as jasmine.SpyObj<EliteService>;
    eliteServiceSpy.getEliteDashboard.and.returnValue(of(mockDashboardData));
    eliteServiceSpy.getInsightStats.and.returnValue(of(mockInsightStats));
    eliteServiceSpy.getConversionPatterns.and.returnValue(of(mockPatterns));
    eliteServiceSpy.getInsightTypeIcon.and.returnValue('lightbulb');

    fixture = TestBed.createComponent(EliteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    expect(eliteServiceSpy.getEliteDashboard).toHaveBeenCalled();
    expect(eliteServiceSpy.getInsightStats).toHaveBeenCalled();
    expect(eliteServiceSpy.getConversionPatterns).toHaveBeenCalled();
  });

  it('should have dashboard data after loading', () => {
    expect(component.dashboardData).toBeTruthy();
    expect(component.dashboardData?.metrics.total_opportunities).toBe(50);
    expect(component.dashboardData?.metrics.success_rate).toBe(0.25);
  });

  it('should display recent outcomes with subreddit and title', () => {
    const outcomes = component.dashboardData?.recent_outcomes;
    expect(outcomes).toBeTruthy();
    expect(outcomes?.length).toBe(2);

    // Check first outcome has subreddit and title
    expect(outcomes?.[0].subreddit).toBe('baseballcards');
    expect(outcomes?.[0].post_title).toBe('Looking for vintage cards from the 1980s');

    // Check second outcome has subreddit and title
    expect(outcomes?.[1].subreddit).toBe('pokemontcg');
    expect(outcomes?.[1].post_title).toContain('Best way to store my collection');
  });

  it('should format percentage correctly', () => {
    expect(component.formatPercentage(0.25)).toBe('25.0%');
    expect(component.formatPercentage(0.5)).toBe('50.0%');
    expect(component.formatPercentage(1)).toBe('100.0%');
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(10.5)).toBe('$10.50');
    expect(component.formatCurrency(0)).toBe('$0.00');
  });

  it('should build intent chart data correctly', () => {
    expect(component.intentChartData.length).toBe(4);
    expect(component.intentChartData[0].label).toBe('Active Seeking');
    expect(component.intentChartData[0].count).toBe(10);
    expect(component.intentChartData[1].label).toBe('Pain Expression');
    expect(component.intentChartData[1].count).toBe(20);
  });

  it('should calculate intent percentage correctly', () => {
    // Total is 10 + 20 + 15 + 5 = 50
    expect(component.getIntentPercentage(10)).toBe(20);
    expect(component.getIntentPercentage(20)).toBe(40);
  });
});
