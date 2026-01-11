import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-live',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-live.component.html',
  styleUrls: ['./landing-live.component.scss']
})
export class LandingLiveComponent {}
