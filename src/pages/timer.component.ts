
import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
import { GeminiService } from '../services/gemini.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TimerState = 'setup' | 'priming' | 'running' | 'reflection';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
       <!-- Ambient Background -->
       <div class="absolute inset-0 z-0">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
       </div>

       <div class="z-10 w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700 shadow-2xl rounded-3xl p-8 text-center transition-colors min-h-[400px] flex flex-col justify-center">
          
          <!-- STATE 1: SETUP -->
          @if (timerState() === 'setup') {
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Focus Session</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Design your deep work block.</p>

            <div class="space-y-6">
               <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mode</label>
                  <div class="flex justify-center gap-2">
                    @for (mode of timerModes; track mode.label) {
                      <button 
                        (click)="selectMode(mode)"
                        class="px-3 py-2 rounded-xl text-xs font-bold transition-all border"
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
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                  <div class="grid grid-cols-3 gap-2">
                    @for (sub of subjects; track sub) {
                      <button 
                        (click)="selectedSubject.set(sub)"
                        class="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                        [class.bg-indigo-600]="selectedSubject() === sub"
                        [class.text-white]="selectedSubject() === sub"
                        [class.border-indigo-600]="selectedSubject() === sub"
                        [class.bg-slate-50]="selectedSubject() !== sub"
                        [class.text-slate-600]="selectedSubject() !== sub"
                        [class.border-slate-200]="selectedSubject() !== sub"
                        [class.dark:bg-slate-700]="selectedSubject() !== sub"
                        [class.dark:text-slate-300]="selectedSubject() !== sub"
                        [class.dark:border-slate-600]="selectedSubject() !== sub">
                        {{ sub }}
                      </button>
                    }
                  </div>
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specific Topic (Optional)</label>
                  <input type="text" [(ngModel)]="targetTopic" placeholder="e.g. Rotational Motion" 
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-center">
               </div>

               <button (click)="initiatePriming()" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]">
                 Start Cognitive Priming
               </button>
            </div>
          }

          <!-- STATE 2: PRIMING -->
          @if (timerState() === 'priming') {
             <div class="animate-in fade-in zoom-in duration-300">
                @if (primingLoading()) {
                   <div class="py-12 flex flex-col items-center">
                      <div class="relative w-16 h-16 mb-4">
                         <div class="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                         <div class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 class="text-lg font-bold text-slate-800 dark:text-white">Calibrating Neural Pathways...</h3>
                      <p class="text-slate-500 text-sm mt-2">Generating attention anchors for {{ targetTopic || selectedSubject() }}</p>
                   </div>
                } @else {
                   <h2 class="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">Cognitive Priming</h2>
                   
                   <div class="text-left space-y-4 mb-8">
                      <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                         <h4 class="text-xs font-bold text-indigo-500 uppercase mb-2">Attention Anchors</h4>
                         <ul class="space-y-2">
                            @for (anchor of primingData()?.anchors; track $index) {
                               <li class="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                                  <span class="text-indigo-500 mt-0.5">✦</span>
                                  {{ anchor }}
                               </li>
                            }
                         </ul>
                      </div>
                      
                      @if (primingData()?.micro_challenge) {
                        <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                           <h4 class="text-xs font-bold text-amber-500 uppercase mb-1">Micro-Challenge</h4>
                           <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ primingData()?.micro_challenge }}</p>
                        </div>
                      }
                   </div>

                   <button (click)="startTimer()" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                      <span>I'm Ready to Focus</span>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                   </button>
                }
             </div>
          }

          <!-- STATE 3: RUNNING -->
          @if (timerState() === 'running') {
            <div class="animate-in fade-in duration-300">
               <div class="mb-8">
                 <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 animate-pulse">
                   {{ selectedMode().label }} • {{ selectedSubject() }}
                 </span>
                 @if (targetTopic) {
                   <p class="text-xs text-slate-400 mt-2">{{ targetTopic }}</p>
                 }
               </div>

               <!-- Circular Timer -->
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
                     <span class="text-6xl font-mono font-bold text-slate-800 dark:text-white tracking-tighter">{{ displayTime() }}</span>
                     <span class="text-sm text-slate-400 mt-2 font-medium">min remaining</span>
                  </div>
               </div>

               <div class="flex items-center justify-center gap-4">
                 <button (click)="stopTimer()" class="bg-rose-500 hover:bg-rose-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all" title="Give Up">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg>
                 </button>
               </div>
            </div>
          }

          <!-- STATE 4: REFLECTION -->
          @if (timerState() === 'reflection') {
             <div class="animate-in zoom-in duration-300">
                <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Session Complete</h2>
                <p class="text-slate-500 mb-8">How deep was your focus?</p>
                
                <div class="flex justify-center gap-2 mb-8">
                   @for (star of [1,2,3,4,5]; track star) {
                      <button (click)="focusRating.set(star)" class="transition-transform hover:scale-110 focus:outline-none">
                         <svg class="w-10 h-10 transition-colors" [class.text-amber-400]="focusRating() >= star" [class.text-slate-200]="focusRating() < star" [class.dark:text-slate-700]="focusRating() < star" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                         </svg>
                      </button>
                   }
                </div>

                <button (click)="completeSession()" [disabled]="focusRating() === 0" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                   Log Cognitive Data
                </button>
             </div>
          }
       </div>
    </div>
  `
})
export class TimerComponent implements OnDestroy {
  store = inject(StudyStore);
  gemini = inject(GeminiService);
  
  subjects = ['Physics', 'Chemistry', 'Biology'];
  selectedSubject = signal('Biology');
  targetTopic = '';
  
  timerModes = [
    { label: 'Pomodoro', minutes: 25 },
    { label: 'Deep Work', minutes: 90 },
    { label: 'Short Break', minutes: 5 }
  ];
  selectedMode = signal(this.timerModes[0]);

  // States
  timerState = signal<TimerState>('setup');
  primingLoading = signal(false);
  primingData = signal<any>(null);
  focusRating = signal(0);

  // Timer Logic
  duration = 25 * 60; 
  timeLeft = signal(25 * 60);
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

  async initiatePriming() {
    if (this.selectedMode().label.includes('Break')) {
       this.startTimer(); // Skip priming for breaks
       return;
    }

    this.timerState.set('priming');
    this.primingLoading.set(true);
    try {
       const topic = this.targetTopic || this.selectedSubject();
       const data = await this.gemini.generatePriming(topic, this.selectedSubject());
       this.primingData.set(data);
    } catch (e) {
       // Fallback if AI fails
       this.primingData.set({
          anchors: ["Focus on understanding, not just memorizing.", "Visualize the concept in real life.", "Connect this to a previous chapter."],
          micro_challenge: "Take 3 deep breaths and visualize success."
       });
    } finally {
       this.primingLoading.set(false);
    }
  }

  startTimer() {
    this.timerState.set('running');
    this.intervalId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 0) {
          this.finishTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.intervalId);
    if(confirm("End session early?")) {
      this.timerState.set('setup');
      this.resetTimer();
    } else {
      // Resume logic could go here, for now just restarting interval
      this.startTimer();
    }
  }

  finishTimer() {
    clearInterval(this.intervalId);
    try {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    } catch(e) {}
    
    if (this.selectedMode().label.includes('Break')) {
       this.timerState.set('setup');
       this.resetTimer();
    } else {
       this.timerState.set('reflection');
    }
  }

  completeSession() {
    this.store.addLog(
      this.selectedSubject(), 
      Math.floor(this.duration / 60), 
      this.targetTopic, 
      this.focusRating()
    );
    this.timerState.set('setup');
    this.resetTimer();
    this.targetTopic = '';
    this.focusRating.set(0);
  }

  resetTimer() {
    this.timeLeft.set(this.duration);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
