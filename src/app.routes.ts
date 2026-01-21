import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'routine', 
    loadComponent: () => import('./pages/routine.component').then(m => m.RoutineComponent) 
  },
  { 
    path: 'timer', 
    loadComponent: () => import('./pages/timer.component').then(m => m.TimerComponent) 
  },
  { 
    path: 'tutor', 
    loadComponent: () => import('./pages/tutor.component').then(m => m.TutorComponent) 
  },
  { 
    path: 'analytics', 
    loadComponent: () => import('./pages/analytics.component').then(m => m.AnalyticsComponent) 
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./pages/settings.component').then(m => m.SettingsComponent) 
  },
];