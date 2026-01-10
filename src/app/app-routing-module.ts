import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { AnonymousGuard } from './shared/guards/anonymous.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [AnonymousGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  // Future modules
  // {
  //   path: 'opportunities',
  //   loadChildren: () => import('./opportunities/opportunities.module').then(m => m.OpportunitiesModule),
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'subreddits',
  //   loadChildren: () => import('./subreddits/subreddits.module').then(m => m.SubredditsModule),
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'settings',
  //   loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
  //   canActivate: [AuthGuard]
  // },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
