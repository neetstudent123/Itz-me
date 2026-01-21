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

export interface MistakeEntry {
  id: string;
  date: string;
  questionImage?: string;
  questionText: string;
  analysis: {
    error_category: string;
    root_concept_to_revise: string;
    correction_strategy: string;
  };
}

export interface UserSettings {
  wakeUpTime: string;
  dailyGoal: number; // hours
  darkMode: boolean;
  chronotype: 'EarlyBird' | 'NightOwl';
}

@Injectable({
  providedIn: 'root'
})
export class StudyStore {
  // State Signals
  userName = signal<string>('Aspirant');
  streak = signal<number>(12);
  streakFreezes = signal<number>(1);
  
  // Gamification
  xp = signal<number>(1250);
  // Simple Level Formula: Level = sqrt(XP) / 2 roughly, or simple thresholds
  studyLevel = computed(() => Math.floor(this.xp() / 100) + 1);
  levelTitle = computed(() => {
    const lvl = this.studyLevel();
    if (lvl < 10) return 'Novice Aspirant';
    if (lvl < 25) return 'Syllabus Surfer';
    if (lvl < 40) return 'Concept Master';
    return 'NEET Legend';
  });

  // Settings
  settings = signal<UserSettings>({
    wakeUpTime: '06:00',
    dailyGoal: 6,
    darkMode: false,
    chronotype: 'EarlyBird'
  });
  
  // Routine
  dailyRoutine = signal<Task[]>([]);
  routineDate = signal<string>(new Date().toDateString());

  // Data
  logs = signal<StudyLog[]>([]);
  mistakeLog = signal<MistakeEntry[]>([]);

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

    effect(() => {
      if (this.settings().darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  // New Gamification Formula
  // Formula: Study_Level = (Hours_Studied * 0.4) + (MCQ_Accuracy * 0.3) + (Task_Completion * 0.3)
  // We apply this logic to XP accumulation.
  calculateXP(minutesStudied: number, taskCompleted: boolean, mcqAccuracy: number = 0) {
    // 1 Hour of study = 100 points base (so * 0.4 weight = 40 XP per hour)
    // Task Complete = 100 points base (so * 0.3 weight = 30 XP)
    // 100% Accuracy = 100 points base (so * 0.3 weight = 30 XP)

    const hoursScore = (minutesStudied / 60) * 100 * 0.4;
    const taskScore = taskCompleted ? (100 * 0.3) : 0;
    const accuracyScore = (mcqAccuracy / 100) * 100 * 0.3; // mcqAccuracy is 0-100

    const gained = Math.floor(hoursScore + taskScore + accuracyScore);
    this.xp.update(current => current + gained);
    return gained;
  }

  addLog(subject: string, minutes: number) {
    this.logs.update(l => [...l, { date: new Date().toISOString(), subject, durationMinutes: minutes }]);
    this.calculateXP(minutes, true, 0); 
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
      const task = newTasks[index];
      task.completed = !task.completed;
      
      if (task.completed) {
        this.calculateXP(0, true, 0); // Just task completion XP
      }
      return newTasks;
    });
  }

  addMistake(entry: MistakeEntry) {
    this.mistakeLog.update(m => [entry, ...m]);
  }

  useStreakFreeze() {
    if (this.streakFreezes() > 0) {
      this.streakFreezes.update(s => s - 1);
      // Logic to extend streak would go here
    }
  }

  addStreakFreeze() {
    this.streakFreezes.update(s => s + 1);
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
      this.streakFreezes.set(parsed.streakFreezes || 1);
      this.xp.set(parsed.xp || 1250);
      this.dailyRoutine.set(parsed.dailyRoutine || []);
      this.logs.set(parsed.logs || []);
      this.mistakeLog.set(parsed.mistakeLog || []);
      if (parsed.settings) {
        this.settings.set({ ...this.settings(), ...parsed.settings });
      }
    }
  }

  private saveState() {
    const state = {
      userName: this.userName(),
      streak: this.streak(),
      streakFreezes: this.streakFreezes(),
      xp: this.xp(),
      dailyRoutine: this.dailyRoutine(),
      logs: this.logs(),
      mistakeLog: this.mistakeLog(),
      settings: this.settings()
    };
    localStorage.setItem('neet_app_state', JSON.stringify(state));
  }
}