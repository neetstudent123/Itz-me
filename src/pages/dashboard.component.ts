
import { Component, inject } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
import { GeminiService } from '../services/gemini.service';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-20">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-slate-800 dark:text-white">Welcome back, {{ store.userName() }}</h2>
          <p class="text-slate-500 dark:text-slate-400">Let's keep the momentum going.</p>
        </div>
        <div class="flex items-center gap-3">
           <!-- Streak Badge -->
           <div class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-800">
             <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.006-.977 1 1 0 00-.987 1.13 6.997 6.997 0 002.583 4.417 5.999 5.999 0 0010.59-4.403 1 1 0 00-1.008-.98 1 1 0 00-.996 1.126 3.001 3.001 0 01-1.636 2.87 3.001 3.001 0 01-3.32-4.088c.07-.365.176-.717.313-1.048.27-.65.626-1.268 1.056-1.785a1 1 0 00.354-.784 1 1 0 00-.323-.748z" clip-rule="evenodd"></path></svg>
             <span class="font-bold">{{ store.streak() }} Day Streak</span>
           </div>
           
           <!-- Settings Icon (Added as requested) -->
           <a routerLink="/settings" class="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 rounded-full transition-all" title="Settings">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
           </a>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Redesigned Study Level Card -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40 relative overflow-hidden group">
           <!-- Graph Icon top right -->
           <div class="absolute top-4 right-4 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
           </div>

           <div>
              <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Study Level</p>
              <h3 class="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{{ store.studyLevel() }}</h3>
           </div>
           
           <div>
               <div class="flex items-center gap-2 mb-1">
                   <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                     {{ store.levelTitle() }}
                   </span>
               </div>
               <p class="text-xs text-slate-400">Top 15% of aspirants</p>
           </div>
        </div>

        <!-- Daily Progress -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40">
           <div class="flex justify-between items-start">
             <div>
               <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily Progress</p>
               <h3 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ store.progressPercent() | number:'1.0-0' }}%</h3>
             </div>
             <div class="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
           </div>
           <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
             <div class="bg-emerald-500 h-1.5 rounded-full" [style.width.%]="store.progressPercent()"></div>
           </div>
        </div>

        <!-- Focus Mode -->
        <div class="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between h-40 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" routerLink="/timer">
           <div class="relative z-10">
             <p class="text-indigo-200 text-sm font-medium">Focus Mode</p>
             <h3 class="text-2xl font-bold mt-1">Start Session</h3>
           </div>
           <div class="relative z-10 flex items-center gap-2 text-sm font-medium">
             <span>Begin 90min Block</span>
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
           </div>
           <!-- Decorative BG -->
           <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
      </div>

      <!-- Updates Section (Search Grounding) -->
      @if (examNews) {
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl">
           <div class="flex gap-3 items-start">
             <div class="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300 shrink-0">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
             </div>
             <div>
               <h4 class="font-semibold text-blue-900 dark:text-blue-200">Latest Exam Updates</h4>
               <p class="text-sm text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">{{ examNews }}</p>
             </div>
           </div>
        </div>
      }

      <!-- Next Up Routine -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-slate-800 dark:text-white">Today's Schedule</h3>
          <a routerLink="/routine" class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">View Full Plan</a>
        </div>
        
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
          @if (store.dailyRoutine().length === 0) {
            <div class="p-8 text-center text-slate-500 dark:text-slate-400">
               <p>No routine generated for today.</p>
               <button routerLink="/routine" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Generate Plan</button>
            </div>
          } @else {
            @for (task of store.dailyRoutine().slice(0, 3); track $index) {
              <div class="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div class="w-16 text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
                  <div>{{ task.time_start }}</div>
                  <div class="h-4 w-px bg-slate-200 dark:bg-slate-600 mx-auto my-1"></div>
                  <div>{{ task.time_end }}</div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/30">{{ task.subject }}</span>
                    <span class="text-xs text-slate-400">{{ task.type }}</span>
                  </div>
                  <h4 class="text-slate-800 dark:text-white font-medium">{{ task.activity }}</h4>
                </div>
                <div class="shrink-0">
                  <div class="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" [class.bg-emerald-500]="task.completed" [class.border-emerald-500]="task.completed"></div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Analytics Shortcut (Added as requested) -->
      <a routerLink="/analytics" class="block group relative overflow-hidden bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all hover:shadow-md cursor-pointer">
          <div class="flex items-center justify-between relative z-10">
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <div>
                   <h3 class="font-bold text-slate-800 dark:text-white">Performance Analytics</h3>
                   <p class="text-sm text-slate-500 dark:text-slate-400">Tap to analyze your study trends and focus depth</p>
                </div>
             </div>
             <svg class="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
      </a>
    </div>
  `
})
export class DashboardComponent {
  store = inject(StudyStore);
  gemini = inject(GeminiService);
  examNews = '';

  constructor() {
    this.loadNews();
  }

  async loadNews() {
    try {
      this.examNews = await this.gemini.getExamUpdates();
    } catch (e) {
      console.log('Failed to load news');
    }
  }
}
