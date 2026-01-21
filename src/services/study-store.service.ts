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

export interface UserSettings {
  wakeUpTime: string;
  dailyGoal: number; // hours
  darkMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudyStore {
  // State Signals
  userName = signal<string>('Aspirant');
  streak = signal<number>(12);
  studyLevel = signal<number>(42); // Level 42 Bio-Master
  
  // Settings
  settings = signal<UserSettings>({
    wakeUpTime: '06:00',
    dailyGoal: 6,
    darkMode: false
  });
  
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

    // Apply Dark Mode
    effect(() => {
      if (this.settings().darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  addLog(subject: string, minutes: number) {
    this.logs.update(l => [...l, { date: new Date().toISOString(), subject, durationMinutes: minutes }]);
    this.updateLevel(minutes);
  }

  updateLevel(minutes: number) {
    // Simple gamification logic
    const points = minutes * 0.5; 
    this.studyLevel.update(l => l + Math.floor(points / 60)); 
  }

  setRoutine(tasks: Task[]) {
    this.dailyRoutine.set(tasks.map(t => ({...t, completed: false})));
  }

  addTask(task: Task) {
    this.dailyRoutine.update(tasks => [...tasks, task].sort((a, b) => a.time_start.localeCompare(b.time_start)));
  }

  toggleTask(index: number) {
    this.dailyRoutine.update(tasks => {
      const newTasks = [...tasks];
      newTasks[index].completed = !newTasks[index].completed;
      return newTasks;
    });
  }

  updateSettings(newSettings: Partial<UserSettings>) {
    this.settings.update(s => ({ ...s, ...newSettings }));
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
      if (parsed.settings) {
        this.settings.set({ ...this.settings(), ...parsed.settings });
      }
    }
  }

  private saveState() {
    const state = {
      userName: this.userName(),
      streak: this.streak(),
      studyLevel: this.studyLevel(),
      dailyRoutine: this.dailyRoutine(),
      logs: this.logs(),
      settings: this.settings()
    };
    localStorage.setItem('neet_app_state', JSON.stringify(state));
  }
}