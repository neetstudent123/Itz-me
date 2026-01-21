import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden">
       <!-- Ambient Background -->
       <div class="absolute inset-0 z-0 bg-slate-50">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-3xl opacity-50"></div>
       </div>

       <div class="z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 text-center">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">Deep Work Session</h2>

          <!-- Subject Selector -->
          @if (!isRunning()) {
            <div class="mb-8">
              <label class="block text-sm font-medium text-slate-500 mb-2">Select Focus Area</label>
              <div class="grid grid-cols-3 gap-2">
                @for (sub of subjects; track sub) {
                  <button 
                    (click)="selectedSubject.set(sub)"
                    class="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    [class.bg-indigo-600]="selectedSubject() === sub"
                    [class.text-white]="selectedSubject() === sub"
                    [class.bg-slate-100]="selectedSubject() !== sub"
                    [class.text-slate-600]="selectedSubject() !== sub">
                    {{ sub }}
                  </button>
                }
              </div>
            </div>
          } @else {
             <div class="mb-8">
               <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 animate-pulse">
                 Focusing on {{ selectedSubject() }}
               </span>
             </div>
          }

          <!-- Timer Display -->
          <div class="relative w-64 h-64 mx-auto mb-8">
             <svg class="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="120" stroke="currentColor" stroke-width="8" fill="none" class="text-slate-100" />
                <circle cx="128" cy="128" r="120" stroke="currentColor" stroke-width="8" fill="none" 
                  class="text-indigo-600 transition-all duration-1000 ease-linear"
                  [style.stroke-dasharray]="circumference"
                  [style.stroke-dashoffset]="dashOffset()"
                  stroke-linecap="round" />
             </svg>
             <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-5xl font-mono font-bold text-slate-800 tracking-tighter">{{ displayTime() }}</span>
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
         <p class="text-slate-500 text-sm">Today's Focus: <span class="font-bold text-indigo-600">{{ store.totalStudyHours() }} hours</span></p>
       </div>
    </div>
  `
})
export class TimerComponent implements OnDestroy {
  store = inject(StudyStore);
  
  subjects = ['Physics', 'Chemistry', 'Biology'];
  selectedSubject = signal('Biology');
  
  // Timer State
  duration = 90 * 60; // 90 minutes in seconds
  timeLeft = signal(90 * 60);
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
    // Log partial session if needed, for now just reset
    this.resetTimer();
  }

  completeSession() {
    this.pauseTimer();
    this.store.addLog(this.selectedSubject(), Math.floor(this.duration / 60));
    alert("Session Complete! Great job.");
    this.resetTimer();
  }

  resetTimer() {
    this.timeLeft.set(this.duration);
  }

  ngOnDestroy() {
    this.pauseTimer();
  }
}