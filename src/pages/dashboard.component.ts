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
          <h2 class="text-3xl font-bold text-slate-800">Welcome back, {{ store.userName() }}</h2>
          <p class="text-slate-500">Let's keep the momentum going.</p>
        </div>
        <div class="flex items-center gap-2">
           <!-- Streak Badge -->
           <div class="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
             <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.006-.977 1 1 0 00-.987 1.13 6.997 6.997 0 002.583 4.417 5.999 5.999 0 0010.59-4.403 1 1 0 00-1.008-.98 1 1 0 00-.996 1.126 3.001 3.001 0 01-1.636 2.87 3.001 3.001 0 01-3.32-4.088c.07-.365.176-.717.313-1.048.27-.65.626-1.268 1.056-1.785a1 1 0 00.354-.784 1 1 0 00-.323-.748z" clip-rule="evenodd"></path></svg>
             <span class="font-bold">{{ store.streak() }} Day Streak</span>
           </div>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
           <div class="flex justify-between items-start">
             <div>
               <p class="text-sm text-slate-500 font-medium">Study Level</p>
               <h3 class="text-3xl font-bold text-indigo-600 mt-1">{{ store.studyLevel() }}</h3>
             </div>
             <div class="bg-indigo-50 p-2 rounded-lg text-indigo-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
           </div>
           <p class="text-xs text-slate-400">Top 15% of aspirants</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
           <div class="flex justify-between items-start">
             <div>
               <p class="text-sm text-slate-500 font-medium">Daily Progress</p>
               <h3 class="text-3xl font-bold text-emerald-600 mt-1">{{ store.progressPercent() | number:'1.0-0' }}%</h3>
             </div>
             <div class="bg-emerald-50 p-2 rounded-lg text-emerald-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
           </div>
           <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2">
             <div class="bg-emerald-500 h-1.5 rounded-full" [style.width.%]="store.progressPercent()"></div>
           </div>
        </div>

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
        <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl">
           <div class="flex gap-3 items-start">
             <div class="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
             </div>
             <div>
               <h4 class="font-semibold text-blue-900">Latest Exam Updates</h4>
               <p class="text-sm text-blue-800 mt-1 leading-relaxed">{{ examNews }}</p>
             </div>
           </div>
        </div>
      }

      <!-- Next Up Routine -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-slate-800">Today's Schedule</h3>
          <a routerLink="/routine" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View Full Plan</a>
        </div>
        
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          @if (store.dailyRoutine().length === 0) {
            <div class="p-8 text-center text-slate-500">
               <p>No routine generated for today.</p>
               <button routerLink="/routine" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Generate Plan</button>
            </div>
          } @else {
            @for (task of store.dailyRoutine().slice(0, 3); track $index) {
              <div class="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div class="w-16 text-xs text-slate-500 font-medium text-center">
                  <div>{{ task.time_start }}</div>
                  <div class="h-4 w-px bg-slate-200 mx-auto my-1"></div>
                  <div>{{ task.time_end }}</div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded text-indigo-700 bg-indigo-50">{{ task.subject }}</span>
                    <span class="text-xs text-slate-400">{{ task.type }}</span>
                  </div>
                  <h4 class="text-slate-800 font-medium">{{ task.activity }}</h4>
                </div>
                <div class="shrink-0">
                  <div class="w-6 h-6 rounded-full border-2 border-slate-300" [class.bg-emerald-500]="task.completed" [class.border-emerald-500]="task.completed"></div>
                </div>
              </div>
            }
          }
        </div>
      </div>
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
      // Small check to avoid spamming API on every load if cached, skipping for demo brevity
      this.examNews = await this.gemini.getExamUpdates();
    } catch (e) {
      console.log('Failed to load news');
    }
  }
}