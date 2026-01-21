
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyStore } from '../services/study-store.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-slate-100 dark:bg-slate-950 transition-colors p-6 md:p-10 pb-24 overflow-y-auto">
      
      <!-- Central Settings Chamber -->
      <div class="max-w-2xl mx-auto w-full">
         <div class="mb-8 text-center">
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white">System Config</h2>
            <p class="text-slate-500 dark:text-slate-400">Manage your cognitive environment</p>
         </div>

         <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <!-- Sub-Chamber: Bio-Rhythm -->
            <div class="p-6 border-b border-slate-100 dark:border-slate-800">
               <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                     <h3 class="font-bold text-slate-800 dark:text-white">Chronotype</h3>
                     <p class="text-xs text-slate-500">Optimizes routine generation</p>
                  </div>
               </div>
               
               <div class="grid grid-cols-2 gap-4">
                  <button (click)="updateChronotype('EarlyBird')" 
                     class="p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                     [class.border-rose-500]="store.settings().chronotype === 'EarlyBird'"
                     [class.bg-rose-50]="store.settings().chronotype === 'EarlyBird'"
                     [class.dark:bg-rose-900/20]="store.settings().chronotype === 'EarlyBird'"
                     [class.border-slate-100]="store.settings().chronotype !== 'EarlyBird'"
                     [class.dark:border-slate-800]="store.settings().chronotype !== 'EarlyBird'">
                     <span class="text-2xl">🌅</span>
                     <span class="font-bold text-sm text-slate-700 dark:text-slate-300">Early Bird</span>
                  </button>
                  <button (click)="updateChronotype('NightOwl')" 
                     class="p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                     [class.border-indigo-500]="store.settings().chronotype === 'NightOwl'"
                     [class.bg-indigo-50]="store.settings().chronotype === 'NightOwl'"
                     [class.dark:bg-indigo-900/20]="store.settings().chronotype === 'NightOwl'"
                     [class.border-slate-100]="store.settings().chronotype !== 'NightOwl'"
                     [class.dark:border-slate-800]="store.settings().chronotype !== 'NightOwl'">
                     <span class="text-2xl">🦉</span>
                     <span class="font-bold text-sm text-slate-700 dark:text-slate-300">Night Owl</span>
                  </button>
               </div>
            </div>

            <!-- Sub-Chamber: Targets -->
            <div class="p-6 border-b border-slate-100 dark:border-slate-800">
               <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                     <h3 class="font-bold text-slate-800 dark:text-white">Daily Load</h3>
                     <p class="text-xs text-slate-500">Target study hours per day</p>
                  </div>
               </div>
               
               <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <input type="range" min="1" max="16" step="1" [ngModel]="store.settings().dailyGoal" (ngModelChange)="updateGoal($event)" class="flex-1 accent-emerald-500">
                  <div class="w-16 text-center font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">
                     {{ store.settings().dailyGoal }}h
                  </div>
               </div>
            </div>

            <!-- Sub-Chamber: System -->
            <div class="p-6">
               <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                     </div>
                     <div>
                        <h3 class="font-bold text-slate-800 dark:text-white">Dark Mode</h3>
                     </div>
                  </div>
                  
                  <button 
                   (click)="toggleDarkMode()" 
                   class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                   [class.bg-indigo-600]="store.settings().darkMode"
                   [class.bg-slate-200]="!store.settings().darkMode">
                   <span 
                     class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm"
                     [class.translate-x-7]="store.settings().darkMode"
                     [class.translate-x-1]="!store.settings().darkMode">
                   </span>
                 </button>
               </div>
               
               <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     </div>
                     <div class="flex-1">
                        <h3 class="font-bold text-slate-800 dark:text-white">Wake Up</h3>
                        <p class="text-xs text-slate-500">Morning alarm target</p>
                     </div>
                     <input type="time" [ngModel]="store.settings().wakeUpTime" (ngModelChange)="updateWakeUp($event)" 
                        class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-white">
                  </div>
               </div>
            </div>

         </div>
         
         <div class="text-center mt-8 opacity-50 text-xs">
            System v1.2 • AI Core Active
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

  updateChronotype(type: 'EarlyBird' | 'NightOwl') {
    this.store.updateSettings({ chronotype: type });
  }

  toggleDarkMode() {
    this.store.updateSettings({ darkMode: !this.store.settings().darkMode });
  }
}
