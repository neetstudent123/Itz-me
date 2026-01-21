import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyStore } from '../services/study-store.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-10 max-w-2xl mx-auto pb-24 text-slate-800 dark:text-slate-100 transition-colors">
      <h2 class="text-2xl font-bold mb-8">Settings</h2>

      <div class="space-y-6">
        <!-- Alarm Section -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <h3 class="font-bold text-lg">Morning Alarm</h3>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Set your daily wake-up target. We'll send a notification to start your day.</p>
          
          <div class="flex items-center gap-4">
             <input type="time" [ngModel]="store.settings().wakeUpTime" (ngModelChange)="updateWakeUp($event)" 
               class="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-lg font-mono">
             <button class="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Test Alarm</button>
          </div>
        </div>

        <!-- Goals Section -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <div class="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
             <h3 class="font-bold text-lg">Study Goals</h3>
          </div>
          <div class="space-y-4">
             <div>
                <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Daily Target (Hours)</label>
                <div class="flex items-center gap-4">
                  <input type="range" min="1" max="16" step="1" [ngModel]="store.settings().dailyGoal" (ngModelChange)="updateGoal($event)" class="flex-1 accent-indigo-600">
                  <span class="font-bold w-12 text-right">{{ store.settings().dailyGoal }} h</span>
                </div>
             </div>
          </div>
        </div>

        <!-- Appearance Section -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
           <div>
              <div class="flex items-center gap-3 mb-1 text-slate-800 dark:text-white">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                 <h3 class="font-bold">Dark Mode</h3>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Reduce eye strain during night study.</p>
           </div>
           
           <button 
             (click)="toggleDarkMode()" 
             class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
             [class.bg-indigo-600]="store.settings().darkMode"
             [class.bg-slate-200]="!store.settings().darkMode">
             <span 
               class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
               [class.translate-x-6]="store.settings().darkMode"
               [class.translate-x-1]="!store.settings().darkMode">
             </span>
           </button>
        </div>

        <div class="text-center pt-8">
           <p class="text-xs text-slate-400">NEET Focus App v1.1.0 • Built for Aspirants</p>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  store = inject(StudyStore);

  updateWakeUp(time: string) {
    this.store.updateSettings({ wakeUpTime: time });
  }

  updateGoal(hours: number) {
    this.store.updateSettings({ dailyGoal: hours });
  }

  toggleDarkMode() {
    this.store.updateSettings({ darkMode: !this.store.settings().darkMode });
  }
}