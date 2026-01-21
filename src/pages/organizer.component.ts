
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SyllabusService } from '../services/syllabus.service';
import { GeminiService } from '../services/gemini.service';
import { DbService, StoredFile } from '../services/db.service';
import { StudyStore, MistakeEntry } from '../services/study-store.service';

@Component({
  selector: 'app-organizer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden relative">
      <!-- Breadcrumb Header -->
      <div class="px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between sticky top-0 z-20">
        <div class="overflow-hidden">
           <h2 class="text-xl font-bold text-slate-800 dark:text-white truncate">Resource Vault</h2>
           <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap overflow-x-auto no-scrollbar">
             <span (click)="navigate('root')" class="cursor-pointer hover:text-indigo-500 shrink-0">Subjects</span>
             @if (activeSubject()) {
               <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
               <span class="font-medium text-slate-700 dark:text-slate-300 shrink-0">{{ activeSubject() }}</span>
             }
             @if (activeChapter()) {
               <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
               <span class="font-medium text-slate-700 dark:text-slate-300 shrink-0 truncate max-w-[150px]">{{ activeChapter()?.name }}</span>
             }
           </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto relative pb-24 md:pb-6">
        
        <!-- View 1: Subject/Unit Selection -->
        @if (!activeChapter()) {
          <div class="p-4 md:p-6">
            <!-- Subject Tabs -->
            <div class="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-2">
              @for (sub of subjects; track sub) {
                <button (click)="activeSubject.set(sub)" 
                  class="flex-1 min-w-[100px] py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 shadow-sm"
                  [class.bg-indigo-600]="activeSubject() === sub"
                  [class.text-white]="activeSubject() === sub"
                  [class.border-indigo-600]="activeSubject() === sub"
                  [class.bg-white]="activeSubject() !== sub"
                  [class.text-slate-600]="activeSubject() !== sub"
                  [class.border-slate-200]="activeSubject() !== sub"
                  [class.dark:bg-slate-800]="activeSubject() !== sub"
                  [class.dark:text-slate-300]="activeSubject() !== sub"
                  [class.dark:border-slate-700]="activeSubject() !== sub">
                  <span class="text-2xl font-bold">{{ sub[0] }}</span>
                  <span class="text-sm font-medium">{{ sub }}</span>
                </button>
              }
            </div>

            <!-- Unit List -->
            <div class="space-y-4">
               @for (unit of filteredUnits(); track unit.name) {
                 <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <h3 class="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base">{{ unit.name }}</h3>
                    </div>
                    <div class="divide-y divide-slate-100 dark:divide-slate-700">
                       @for (chapter of unit.chapters; track chapter.id) {
                         <button (click)="openChapter(chapter)" class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
                            <div class="flex items-center gap-3">
                               <div class="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                  <svg class="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                               </div>
                               <div>
                                 <span class="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{{ chapter.name }}</span>
                                 <p class="text-[10px] text-slate-400 font-mono">{{ chapter.id }}</p>
                               </div>
                            </div>
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                         </button>
                       }
                    </div>
                 </div>
               }
            </div>
          </div>
        }

        <!-- View 2: Chapter Detail Dashboard -->
        @if (activeChapter()) {
          <div class="p-4 md:p-6 space-y-6">
            
            <!-- Analysis Banner (Mobile Optimized) -->
            <div class="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div class="relative z-10">
                  <h2 class="text-xl md:text-2xl font-bold leading-tight">{{ activeChapter()?.name }}</h2>
                  <div class="flex items-center gap-4 mt-2">
                     <div>
                       <span class="text-2xl font-bold">{{ currentFiles().length }}</span>
                       <span class="text-xs text-indigo-200 ml-1">Files</span>
                     </div>
                     <div class="w-px h-8 bg-white/20"></div>
                     <div>
                       <span class="text-2xl font-bold">{{ chapterMistakes().length }}</span>
                       <span class="text-xs text-indigo-200 ml-1">Mistakes</span>
                     </div>
                  </div>
               </div>
               
               <button (click)="runAnalysis()" [disabled]="analyzing() || currentFiles().length === 0" 
                  class="relative z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white w-full md:w-auto px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                   @if (analyzing()) {
                     <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Scanning...
                   } @else {
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Generate Health Report
                   }
               </button>
               
               <div class="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <svg class="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
               </div>
            </div>

            <!-- Mistake Sub-Chamber (New) -->
            <div class="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900 rounded-2xl p-5 relative overflow-hidden">
               <div class="flex justify-between items-center relative z-10">
                 <div>
                    <h3 class="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Mistake Diary (Sub-Chamber)
                    </h3>
                    <p class="text-xs text-rose-600 dark:text-rose-400 mt-1">
                      @if (chapterMistakes().length === 0) {
                        No errors recorded for this topic yet.
                      } @else {
                        {{ chapterMistakes().length }} logged errors affecting your mastery.
                      }
                    </p>
                 </div>
                 <button (click)="openMistakeLogger()" class="bg-rose-600 text-white p-2 rounded-lg shadow-sm hover:bg-rose-700 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                 </button>
               </div>
               
               @if (chapterMistakes().length > 0) {
                 <div class="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    @for (m of chapterMistakes(); track m.id) {
                       <div class="min-w-[200px] bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm">
                          <p class="text-xs font-bold text-rose-500 mb-1 line-clamp-1">{{ m.analysis.error_category }}</p>
                          <p class="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{{ m.questionText }}</p>
                       </div>
                    }
                 </div>
               }
            </div>

            <!-- Resource Dashboard (Grid) -->
            <div>
               <h3 class="font-bold text-slate-800 dark:text-white mb-4">Resources</h3>
               <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (cat of ['Notes', 'PYQ', 'Formula']; track cat) {
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                       <div class="flex justify-between items-start mb-3">
                          <div class="flex items-center gap-3">
                             <div class="w-10 h-10 rounded-full flex items-center justify-center"
                               [class.bg-blue-50]="cat === 'Notes'" [class.text-blue-500]="cat === 'Notes'"
                               [class.bg-amber-50]="cat === 'PYQ'" [class.text-amber-500]="cat === 'PYQ'"
                               [class.bg-purple-50]="cat === 'Formula'" [class.text-purple-500]="cat === 'Formula'">
                               @switch(cat) {
                                 @case('Notes') { <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> }
                                 @case('PYQ') { <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> }
                                 @case('Formula') { <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> }
                               }
                             </div>
                             <div>
                               <h4 class="font-bold text-slate-800 dark:text-white">{{ cat }}</h4>
                               <span class="text-xs text-slate-500 dark:text-slate-400">{{ getFilesByCategory(cat).length }} files</span>
                             </div>
                          </div>
                          @if (getFilesByCategory(cat).length > 0) {
                             <div class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full p-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                             </div>
                          }
                       </div>
                       
                       <div class="flex-1 space-y-2 mt-2">
                          @for (file of getFilesByCategory(cat); track file.id) {
                            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group">
                               <div class="flex items-center gap-2 overflow-hidden">
                                  <span class="text-sm text-slate-600 dark:text-slate-300 truncate">{{ file.fileName }}</span>
                               </div>
                               <button (click)="deleteFile(file.id)" class="text-slate-300 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1">
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               </button>
                            </div>
                          }
                          @if (getFilesByCategory(cat).length === 0) {
                             <div class="h-16 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-400">
                                No files yet
                             </div>
                          }
                       </div>
                       
                       <label class="mt-4 w-full py-2 border border-dashed border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 text-sm font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <svg *ngIf="!uploading()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                          <svg *ngIf="uploading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Upload {{ cat }}
                          <input type="file" class="hidden" (change)="handleUpload($event, cat)">
                       </label>
                    </div>
                  }
               </div>
            </div>

            <!-- Analysis Result (Shows if present) -->
            @if (lastAnalysis()) {
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-5 duration-500">
                  <div class="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-5 rounded-2xl">
                     <h3 class="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2 mb-3">
                        Gap Analysis
                     </h3>
                     <ul class="space-y-2">
                        @for (concept of lastAnalysis().missing_concepts; track $index) {
                          <li class="text-sm text-rose-700 dark:text-rose-400 flex items-start gap-2">
                            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            {{ concept }}
                          </li>
                        }
                     </ul>
                  </div>
                  <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-5 rounded-2xl flex flex-col justify-between">
                     <div>
                       <h3 class="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-2">
                          Active Recall
                       </h3>
                       <p class="text-sm text-indigo-600 dark:text-indigo-400 mb-4">5 AI-generated questions from your notes.</p>
                     </div>
                     <button (click)="startQuiz()" class="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Take Quick Quiz</button>
                  </div>
               </div>
            }
          </div>
        }
      </div>

      <!-- Mistake Logger Modal -->
      @if (showMistakeModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in zoom-in-95 duration-200">
              <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4">Log Mistake in {{ activeChapter()?.name }}</h3>
              <textarea [(ngModel)]="mistakeText" rows="4" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-white placeholder-slate-400 resize-none" placeholder="Describe the question and error..."></textarea>
              <div class="mt-4 flex gap-3">
                 <button (click)="showMistakeModal.set(false)" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">Cancel</button>
                 <button (click)="saveMistake()" [disabled]="!mistakeText || analyzing()" class="flex-1 py-3 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-50">
                    {{ analyzing() ? 'Analyzing...' : 'Save to Diary' }}
                 </button>
              </div>
           </div>
        </div>
      }

      <!-- Quiz Modal (Reused) -->
      @if (showQuiz() && lastAnalysis()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
              <div class="flex justify-between items-center mb-4">
                 <h3 class="font-bold text-lg dark:text-white">Generated Quiz</h3>
                 <button (click)="showQuiz.set(false)" class="text-slate-400 hover:text-white">Close</button>
              </div>
              <div class="flex-1 overflow-y-auto space-y-6">
                 @for (q of lastAnalysis().quick_quiz; track $index) {
                   <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p class="font-medium text-slate-800 dark:text-slate-200 mb-3">{{ q.question }}</p>
                      <div class="space-y-2">
                         @for (opt of q.options; track optIdx) {
                            <div class="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-300 cursor-pointer transition-colors"
                              [class.bg-green-100]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.dark:bg-green-900]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.hover:bg-indigo-50]="!quizRevealed()"
                              [class.dark:hover:bg-slate-700]="!quizRevealed()">
                              {{ opt }}
                            </div>
                         }
                      </div>
                      @if (quizRevealed()) {
                        <p class="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">{{ q.explanation }}</p>
                      }
                   </div>
                 }
              </div>
              <div class="pt-4 mt-2">
                 <button (click)="quizRevealed.set(true)" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Reveal Answers</button>
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class OrganizerComponent {
  syllabusService = inject(SyllabusService);
  gemini = inject(GeminiService);
  db = inject(DbService);
  store = inject(StudyStore);

  subjects = ['Physics', 'Chemistry', 'Biology'];
  activeSubject = signal('Physics');
  activeChapter = signal<any>(null);

  // File State
  currentFiles = signal<StoredFile[]>([]);
  uploading = signal(false);

  // Analysis State
  analyzing = signal(false);
  lastAnalysis = signal<any>(null);
  
  // Quiz State
  showQuiz = signal(false);
  quizRevealed = signal(false);

  // Mistake State
  showMistakeModal = signal(false);
  mistakeText = '';
  
  // Computed
  filteredUnits = computed(() => {
    const allData = this.syllabusService.syllabus().filter(s => s.subject === this.activeSubject());
    return allData.reduce((acc: any[], curr) => [...acc, ...curr.units], []);
  });

  chapterMistakes = computed(() => {
     if (!this.activeChapter()) return [];
     return this.store.mistakeLog().filter(m => m.chapterId === this.activeChapter().id);
  });

  navigate(to: string) {
    if (to === 'root') {
      this.activeChapter.set(null);
    }
  }

  async openChapter(chapter: any) {
    this.activeChapter.set(chapter);
    this.lastAnalysis.set(null); 
    await this.refreshFiles(chapter.id);
  }

  async refreshFiles(chapterId: string) {
    const files = await this.db.getFilesByChapter(chapterId);
    this.currentFiles.set(files);
  }

  getFilesByCategory(cat: string) {
    return this.currentFiles().filter(f => f.category === cat);
  }

  async handleUpload(event: Event, category: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.activeChapter()) return;

    this.uploading.set(true);
    try {
      const text = await this.db.extractText(file);
      const storedFile: StoredFile = {
        id: crypto.randomUUID(),
        chapterId: this.activeChapter().id,
        category: category,
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        extractedText: text,
        size: file.size
      };
      await this.db.saveFile(storedFile);
      await this.refreshFiles(this.activeChapter().id);
    } catch (e) {
      console.error(e);
      alert('Failed to process file.');
    } finally {
      this.uploading.set(false);
      input.value = ''; 
    }
  }

  async deleteFile(id: string) {
    if(confirm('Delete this file?')) {
      await this.db.deleteFile(id);
      await this.refreshFiles(this.activeChapter().id);
    }
  }

  async runAnalysis() {
    if (!this.activeChapter()) return;
    this.analyzing.set(true);
    try {
      const allText = this.currentFiles().map(f => f.extractedText).join('\n\n');
      const report = await this.gemini.generateChapterHealthReport(allText, this.activeChapter().name);
      this.lastAnalysis.set(report);
    } catch (e) {
      alert('AI Analysis failed. Try again.');
    } finally {
      this.analyzing.set(false);
    }
  }

  startQuiz() {
    this.quizRevealed.set(false);
    this.showQuiz.set(true);
  }

  openMistakeLogger() {
    this.mistakeText = '';
    this.showMistakeModal.set(true);
  }

  async saveMistake() {
    if (!this.mistakeText) return;
    this.analyzing.set(true);
    try {
       const analysis = await this.gemini.analyzeMistake(this.mistakeText);
       const entry: MistakeEntry = {
          id: crypto.randomUUID(),
          chapterId: this.activeChapter().id,
          date: new Date().toISOString(),
          questionText: this.mistakeText,
          analysis: analysis
       };
       this.store.addMistake(entry);
       this.showMistakeModal.set(false);
    } catch (e) {
       alert('Analysis failed');
    } finally {
       this.analyzing.set(false);
    }
  }
}
