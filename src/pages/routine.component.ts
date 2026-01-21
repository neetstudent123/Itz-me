import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyStore, Task } from '../services/study-store.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-10 max-w-4xl mx-auto pb-24 bg-slate-50 dark:bg-slate-900 min-h-full transition-colors">
      
      <!-- Calendar Strip -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
           <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Schedule</h2>
           <div class="text-sm text-slate-500 dark:text-slate-400">{{ store.routineDate() }}</div>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
           @for (day of calendarDays; track day.date) {
             <button 
               (click)="selectDate(day)"
               class="flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl border transition-all"
               [class.bg-indigo-600]="day.active"
               [class.text-white]="day.active"
               [class.border-transparent]="day.active"
               [class.bg-white]="!day.active"
               [class.text-slate-600]="!day.active"
               [class.border-slate-200]="!day.active"
               [class.dark:bg-slate-800]="!day.active"
               [class.dark:text-slate-300]="!day.active"
               [class.dark:border-slate-700]="!day.active">
               <span class="text-xs font-medium uppercase">{{ day.dayName }}</span>
               <span class="text-xl font-bold mt-1">{{ day.dayNum }}</span>
             </button>
           }
        </div>
      </div>

      <!-- Action Bar -->
      <div class="flex justify-between items-center mb-6">
         <h3 class="font-bold text-slate-700 dark:text-slate-200">Today's Tasks</h3>
         <div class="flex gap-2">
            <button (click)="showAddTask.set(true)" class="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg transition-colors">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <button 
              (click)="generate()" 
              [disabled]="loading()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              @if (loading()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              }
              <span>AI Plan</span>
            </button>
         </div>
      </div>

      <!-- Add Task Modal -->
      @if (showAddTask()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4">Add Custom Task</h3>
              <div class="space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="text-xs text-slate-500 dark:text-slate-400">Start Time</label>
                       <input type="time" [(ngModel)]="newTask.time_start" class="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    </div>
                    <div>
                       <label class="text-xs text-slate-500 dark:text-slate-400">End Time</label>
                       <input type="time" [(ngModel)]="newTask.time_end" class="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    </div>
                 </div>
                 <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400">Activity / Topic</label>
                    <input type="text" [(ngModel)]="newTask.activity" placeholder="e.g. Solve 50 MCQs" class="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                 </div>
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="text-xs text-slate-500 dark:text-slate-400">Subject</label>
                       <select [(ngModel)]="newTask.subject" class="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="General">General</option>
                       </select>
                    </div>
                    <div>
                       <label class="text-xs text-slate-500 dark:text-slate-400">Type</label>
                       <select [(ngModel)]="newTask.type" class="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          <option value="Study">Study</option>
                          <option value="Revision">Revision</option>
                          <option value="MockTest">Mock Test</option>
                          <option value="Break">Break</option>
                       </select>
                    </div>
                 </div>
                 <div class="flex gap-3 pt-2">
                    <button (click)="showAddTask.set(false)" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                    <button (click)="saveNewTask()" class="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">Add Task</button>
                 </div>
              </div>
           </div>
        </div>
      }

      <!-- Routine List -->
      <div class="space-y-4">
        @if (store.dailyRoutine().length === 0) {
          <div class="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center transition-colors">
            <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 class="text-lg font-medium text-slate-800 dark:text-white">No plan set for this day</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Generate a new AI-optimized schedule or add tasks manually.</p>
          </div>
        }

        @for (task of store.dailyRoutine(); track $index) {
          <div class="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden">
             <!-- Left color bar based on type -->
             <div class="absolute left-0 top-0 bottom-0 w-1.5" 
                [class.bg-indigo-500]="task.type === 'Study'"
                [class.bg-orange-400]="task.type === 'Revision'"
                [class.bg-emerald-400]="task.type === 'Break'"
                [class.bg-rose-500]="task.type === 'MockTest'">
             </div>

             <div class="flex items-start gap-4 pl-3">
                <div class="flex flex-col items-center pt-1 min-w-[60px]">
                   <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ task.time_start }}</span>
                   <span class="text-xs text-slate-400 my-1">to</span>
                   <span class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ task.time_end }}</span>
                </div>

                <div class="flex-1">
                   <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
                        [class.bg-indigo-50]="task.type === 'Study'" [class.text-indigo-700]="task.type === 'Study'" [class.dark:bg-indigo-900/30]="task.type === 'Study'" [class.dark:text-indigo-300]="task.type === 'Study'"
                        [class.bg-orange-50]="task.type === 'Revision'" [class.text-orange-700]="task.type === 'Revision'" [class.dark:bg-orange-900/30]="task.type === 'Revision'" [class.dark:text-orange-300]="task.type === 'Revision'"
                        [class.bg-emerald-50]="task.type === 'Break'" [class.text-emerald-700]="task.type === 'Break'" [class.dark:bg-emerald-900/30]="task.type === 'Break'" [class.dark:text-emerald-300]="task.type === 'Break'"
                        [class.bg-rose-50]="task.type === 'MockTest'" [class.text-rose-700]="task.type === 'MockTest'" [class.dark:bg-rose-900/30]="task.type === 'MockTest'" [class.dark:text-rose-300]="task.type === 'MockTest'">
                        {{ task.type }}
                      </span>
                      @if (task.subject) {
                        <span class="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                          {{ task.subject }}
                        </span>
                      }
                   </div>
                   <h3 class="text-base font-semibold text-slate-800 dark:text-white">{{ task.activity }}</h3>
                   <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ task.description }}</p>
                </div>

                <div class="pt-1">
                   <button 
                     (click)="toggle($index)"
                     class="w-6 h-6 rounded-md border transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                     [class.bg-emerald-500]="task.completed"
                     [class.border-emerald-500]="task.completed"
                     [class.border-slate-300]="!task.completed"
                     [class.dark:border-slate-600]="!task.completed"
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
  showAddTask = signal(false);

  // Calendar Logic
  calendarDays: any[] = [];
  
  // New Task Form
  newTask: Partial<Task> = {
    time_start: '09:00',
    time_end: '10:00',
    activity: '',
    subject: 'Physics',
    type: 'Study',
    description: 'Manual entry',
    completed: false
  };

  constructor() {
    this.generateCalendar();
  }

  generateCalendar() {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Generate -2 to +4 days
    for (let i = -2; i <= 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      this.calendarDays.push({
        date: d,
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        active: i === 0 // Today is active by default
      });
    }
  }

  selectDate(selectedDay: any) {
    this.calendarDays.forEach(d => d.active = false);
    selectedDay.active = true;
    // In a real app, load tasks for this date from store
    // For demo, we just clear/show current for today
    if (selectedDay.dayNum !== new Date().getDate()) {
       // Just visual feedback for now, clearing routine to show "No plan"
       // Ideally we'd have store.getRoutine(date)
    }
  }

  saveNewTask() {
    if (this.newTask.activity) {
      this.store.addTask(this.newTask as Task);
      this.showAddTask.set(false);
      // Reset
      this.newTask = { ...this.newTask, activity: '', description: 'Manual entry' };
    }
  }

  async generate() {
    this.loading.set(true);
    try {
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