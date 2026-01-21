import { Injectable, signal, computed, effect } from '@angular/core';

export interface Task {
  time_start: string;
  time_end: string;
  activity: string;
  subject: string;
  type: 'Study' | 'Break' | 'Revision' | 'MockTest';
  description: string;
  completed: boolean;
}

export interface StudyLog {
  date: string;
  subject: string;
  durationMinutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudyStore {
  // State Signals
  userName = signal<string>('Aspirant');
  streak = signal<number>(12);
  studyLevel = signal<number>(42); // Level 42 Bio-Master
  
  // Routine
  dailyRoutine = signal<Task[]>([]);
  routineDate = signal<string>(new Date().toDateString());

  // Logs
  logs = signal<StudyLog[]>([]);

  // Computed
  totalStudyHours = computed(() => {
    return Math.floor(this.logs().reduce((acc, log) => acc + log.durationMinutes, 0) / 60);
  });

  completedTasksCount = computed(() => {
    return this.dailyRoutine().filter(t => t.completed).length;
  });

  progressPercent = computed(() => {
    const total = this.dailyRoutine().length;
    return total === 0 ? 0 : (this.completedTasksCount() / total) * 100;
  });

  constructor() {
    this.loadState();
    
    effect(() => {
      this.saveState();
    });
  }

  addLog(subject: string, minutes: number) {
    this.logs.update(l => [...l, { date: new Date().toISOString(), subject, durationMinutes: minutes }]);
    this.updateLevel(minutes);
  }

  updateLevel(minutes: number) {
    // Simple gamification logic
    const points = minutes * 0.5; 
    // In a real app, this would be more complex
    this.studyLevel.update(l => l + Math.floor(points / 60)); 
  }

  setRoutine(tasks: Task[]) {
    this.dailyRoutine.set(tasks.map(t => ({...t, completed: false})));
  }

  toggleTask(index: number) {
    this.dailyRoutine.update(tasks => {
      const newTasks = [...tasks];
      newTasks[index].completed = !newTasks[index].completed;
      return newTasks;
    });
  }

  private loadState() {
    const saved = localStorage.getItem('neet_app_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.userName.set(parsed.userName || 'Aspirant');
      this.streak.set(parsed.streak || 0);
      this.studyLevel.set(parsed.studyLevel || 1);
      this.dailyRoutine.set(parsed.dailyRoutine || []);
      this.logs.set(parsed.logs || []);
    }
  }

  private saveState() {
    const state = {
      userName: this.userName(),
      streak: this.streak(),
      studyLevel: this.studyLevel(),
      dailyRoutine: this.dailyRoutine(),
      logs: this.logs()
    };
    localStorage.setItem('neet_app_state', JSON.stringify(state));
  }
}