import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
       <!-- Ambient Background -->
       <div class="absolute inset-0 z-0">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
       </div>

       <div class="z-10 w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700 shadow-2xl rounded-3xl p-8 text-center transition-colors">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Focus Session</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Stay consistent, ace NEET.</p>

          <!-- Timer Modes -->
          @if (!isRunning()) {
            <div class="flex justify-center gap-2 mb-6">
              @for (mode of timerModes; track mode.label) {
                <button 
                  (click)="selectMode(mode)"
                  class="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  [class.bg-indigo-600]="selectedMode() === mode"
                  [class.text-white]="selectedMode() === mode"
                  [class.border-indigo-600]="selectedMode() === mode"
                  [class.bg-transparent]="selectedMode() !== mode"
                  [class.text-slate-600]="selectedMode() !== mode"
                  [class.dark:text-slate-300]="selectedMode() !== mode"
                  [class.border-slate-200]="selectedMode() !== mode"
                  [class.dark:border-slate-700]="selectedMode() !== mode">
                  {{ mode.label }}
                </button>
              }
            </div>

            <!-- Subject Selector -->
            <div class="mb-8">
              <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Select Subject</label>
              <div class="grid grid-cols-3 gap-2">
                @for (sub of subjects; track sub) {
                  <button 
                    (click)="selectedSubject.set(sub)"
                    class="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    [class.bg-indigo-600]="selectedSubject() === sub"
                    [class.text-white]="selectedSubject() === sub"
                    [class.bg-slate-100]="selectedSubject() !== sub"
                    [class.text-slate-600]="selectedSubject() !== sub"
                    [class.dark:bg-slate-700]="selectedSubject() !== sub"
                    [class.dark:text-slate-300]="selectedSubject() !== sub">
                    {{ sub }}
                  </button>
                }
              </div>
            </div>
          } @else {
             <div class="mb-8">
               <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 animate-pulse">
                 {{ selectedMode().label }} on {{ selectedSubject() }}
               </span>
             </div>
          }

          <!-- Timer Display -->
          <div class="relative w-64 h-64 mx-auto mb-8">
             <svg class="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="120" stroke="currentColor" stroke-width="8" fill="none" class="text-slate-100 dark:text-slate-700" />
                <circle cx="128" cy="128" r="120" stroke="currentColor" stroke-width="8" fill="none" 
                  class="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-linear"
                  [style.stroke-dasharray]="circumference"
                  [style.stroke-dashoffset]="dashOffset()"
                  stroke-linecap="round" />
             </svg>
             <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-5xl font-mono font-bold text-slate-800 dark:text-white tracking-tighter">{{ displayTime() }}</span>
                <span class="text-sm text-slate-400 mt-2 font-medium">min remaining</span>
             </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-center gap-4">
             @if (!isRunning()) {
               <button (click)="startTimer()" class="bg-indigo-600 hover:bg-indigo-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                  <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
               </button>
             } @else {
               <button (click)="pauseTimer()" class="bg-amber-400 hover:bg-amber-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
               </button>
               <button (click)="stopTimer()" class="bg-rose-500 hover:bg-rose-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg>
               </button>
             }
          </div>
       </div>

       <!-- Session History Summary -->
       <div class="mt-8 text-center">
         <p class="text-slate-500 dark:text-slate-400 text-sm">Today's Focus: <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ store.totalStudyHours() }} hours</span></p>
       </div>
    </div>
  `
})
export class TimerComponent implements OnDestroy {
  store = inject(StudyStore);
  
  subjects = ['Physics', 'Chemistry', 'Biology'];
  selectedSubject = signal('Biology');
  
  timerModes = [
    { label: 'Pomodoro', minutes: 25 },
    { label: 'Short Break', minutes: 5 },
    { label: 'Long Break', minutes: 15 },
    { label: 'Deep Work', minutes: 90 }
  ];
  selectedMode = signal(this.timerModes[0]);

  // Timer State
  duration = 25 * 60; 
  timeLeft = signal(25 * 60);
  isRunning = signal(false);
  intervalId: any;

  circumference = 2 * Math.PI * 120;
  
  dashOffset = computed(() => {
    const progress = this.timeLeft() / this.duration;
    return this.circumference * (1 - progress);
  });

  displayTime = computed(() => {
    const minutes = Math.floor(this.timeLeft() / 60);
    const seconds = this.timeLeft() % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  selectMode(mode: any) {
    this.selectedMode.set(mode);
    this.duration = mode.minutes * 60;
    this.timeLeft.set(this.duration);
  }

  startTimer() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 0) {
          this.completeSession();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  pauseTimer() {
    this.isRunning.set(false);
    clearInterval(this.intervalId);
  }

  stopTimer() {
    this.pauseTimer();
    this.resetTimer();
  }

  completeSession() {
    this.pauseTimer();
    // Only log if it's a study session (not a break)
    if (!this.selectedMode().label.includes('Break')) {
      this.store.addLog(this.selectedSubject(), Math.floor(this.duration / 60));
    }
    // Play notification sound if possible
    try {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    } catch(e) {}
    
    alert(`${this.selectedMode().label} Finished!`);
    this.resetTimer();
  }

  resetTimer() {
    this.timeLeft.set(this.duration);
  }

  ngOnDestroy() {
    this.pauseTimer();
  }
}