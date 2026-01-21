import { Component, inject, signal } from '@angular/core';
import { StudyStore, Task } from '../services/study-store.service';
import { GeminiService } from '../services/gemini.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 md:p-10 max-w-4xl mx-auto pb-24">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Daily Schedule</h2>
          <p class="text-slate-500 text-sm mt-1">{{ store.routineDate() }}</p>
        </div>
        <button 
          (click)="generate()" 
          [disabled]="loading()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          @if (loading()) {
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Generating...
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Create New Routine
          }
        </button>
      </div>

      <!-- Routine List -->
      <div class="space-y-4">
        @if (store.dailyRoutine().length === 0) {
          <div class="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 class="text-lg font-medium text-slate-800">No plan set for today</h3>
            <p class="text-slate-500 mt-2 max-w-sm mx-auto">Generate a new AI-optimized schedule based on your current study level and goals.</p>
          </div>
        }

        @for (task of store.dailyRoutine(); track $index) {
          <div class="group bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden">
             <!-- Left color bar based on type -->
             <div class="absolute left-0 top-0 bottom-0 w-1.5" 
                [class.bg-indigo-500]="task.type === 'Study'"
                [class.bg-orange-400]="task.type === 'Revision'"
                [class.bg-emerald-400]="task.type === 'Break'"
                [class.bg-rose-500]="task.type === 'MockTest'">
             </div>

             <div class="flex items-start gap-4 pl-3">
                <div class="flex flex-col items-center pt-1 min-w-[60px]">
                   <span class="text-sm font-bold text-slate-700">{{ task.time_start }}</span>
                   <span class="text-xs text-slate-400 my-1">to</span>
                   <span class="text-sm font-medium text-slate-500">{{ task.time_end }}</span>
                </div>

                <div class="flex-1">
                   <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
                        [class.bg-indigo-50]="task.type === 'Study'" [class.text-indigo-700]="task.type === 'Study'"
                        [class.bg-orange-50]="task.type === 'Revision'" [class.text-orange-700]="task.type === 'Revision'"
                        [class.bg-emerald-50]="task.type === 'Break'" [class.text-emerald-700]="task.type === 'Break'"
                        [class.bg-rose-50]="task.type === 'MockTest'" [class.text-rose-700]="task.type === 'MockTest'">
                        {{ task.type }}
                      </span>
                      @if (task.subject) {
                        <span class="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                          {{ task.subject }}
                        </span>
                      }
                   </div>
                   <h3 class="text-base font-semibold text-slate-800">{{ task.activity }}</h3>
                   <p class="text-sm text-slate-500 mt-1 leading-relaxed">{{ task.description }}</p>
                </div>

                <div class="pt-1">
                   <button 
                     (click)="toggle($index)"
                     class="w-6 h-6 rounded-md border transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                     [class.bg-emerald-500]="task.completed"
                     [class.border-emerald-500]="task.completed"
                     [class.border-slate-300]="!task.completed"
                     [class.text-white]="task.completed">
                     @if (task.completed) {
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                     }
                   </button>
                </div>
             </div>
          </div>
        }
      </div>
    </div>
  `
})
export class RoutineComponent {
  store = inject(StudyStore);
  gemini = inject(GeminiService);
  loading = signal(false);

  async generate() {
    this.loading.set(true);
    try {
      // Simulate profile data
      const profile = {
        level: this.store.studyLevel(),
        streak: this.store.streak(),
        weakness: "Organic Chemistry",
        exam_days_left: 240
      };
      
      const result = await this.gemini.generateDailyRoutine(profile, "Electrodynamics & Plant Kingdom");
      if (result && result.tasks) {
        this.store.setRoutine(result.tasks);
      }
    } catch (err) {
      alert("Failed to generate routine. Please check API Key.");
    } finally {
      this.loading.set(false);
    }
  }

  toggle(index: number) {
    this.store.toggleTask(index);
  }
}