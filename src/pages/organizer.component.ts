import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SyllabusService, Chapter, Unit } from '../services/syllabus.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-organizer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors">
      <!-- Header -->
      <div class="px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
         <div class="flex justify-between items-center">
            <div>
               <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Smart Organizer</h2>
               <p class="text-xs text-slate-500 dark:text-slate-400">Notes & PYQs • Sorted by AI</p>
            </div>
            <!-- Global Upload Button -->
            <label class="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-2">
               @if (uploading()) {
                 <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               } @else {
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
               }
               <span>Upload File</span>
               <input type="file" class="hidden" (change)="handleFileUpload($event)">
            </label>
         </div>
      </div>

      <!-- Subject Tabs -->
      <div class="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        @for (sub of subjects; track sub) {
          <button 
            (click)="selectedSubject.set(sub)"
            class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative"
            [class.border-indigo-600]="selectedSubject() === sub"
            [class.text-indigo-600]="selectedSubject() === sub"
            [class.dark:text-indigo-400]="selectedSubject() === sub"
            [class.border-transparent]="selectedSubject() !== sub"
            [class.text-slate-500]="selectedSubject() !== sub"
            [class.dark:text-slate-400]="selectedSubject() !== sub">
            {{ sub }}
            <!-- Status Dot if subject has resources (mock logic for demo) -->
            <span class="absolute top-3 right-4 w-2 h-2 rounded-full bg-emerald-500 hidden"></span>
          </button>
        }
      </div>

      <!-- Class Filter -->
      <div class="p-4 flex gap-2 shrink-0">
         <button (click)="selectedClass.set(11)" 
            class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
            [class.bg-slate-800]="selectedClass() === 11" [class.text-white]="selectedClass() === 11"
            [class.bg-white]="selectedClass() !== 11" [class.text-slate-600]="selectedClass() !== 11" [class.border-slate-200]="selectedClass() !== 11"
            [class.dark:bg-slate-700]="selectedClass() === 11" [class.dark:text-white]="selectedClass() === 11"
            [class.dark:bg-slate-800]="selectedClass() !== 11" [class.dark:text-slate-400]="selectedClass() !== 11" [class.dark:border-slate-700]="selectedClass() !== 11">
            Class 11
         </button>
         <button (click)="selectedClass.set(12)" 
            class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
            [class.bg-slate-800]="selectedClass() === 12" [class.text-white]="selectedClass() === 12"
            [class.bg-white]="selectedClass() !== 12" [class.text-slate-600]="selectedClass() !== 12" [class.border-slate-200]="selectedClass() !== 12"
            [class.dark:bg-slate-700]="selectedClass() === 12" [class.dark:text-white]="selectedClass() === 12"
            [class.dark:bg-slate-800]="selectedClass() !== 12" [class.dark:text-slate-400]="selectedClass() !== 12" [class.dark:border-slate-700]="selectedClass() !== 12">
            Class 12
         </button>
      </div>

      <!-- Nested Navigation List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
         @for (unit of currentUnits(); track unit.name) {
           <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <button (click)="toggleUnit(unit.name)" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                 <h3 class="font-semibold text-slate-700 dark:text-slate-200">{{ unit.name }}</h3>
                 <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="isUnitExpanded(unit.name)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              @if (isUnitExpanded(unit.name)) {
                <div class="divide-y divide-slate-100 dark:divide-slate-700">
                   @for (chapter of unit.chapters; track chapter.id) {
                     <div class="p-4 pl-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div class="flex justify-between items-start mb-2">
                           <div class="flex items-center gap-2">
                             <!-- Status Icon -->
                             @if (chapter.resource_links.length > 0) {
                               <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                               </div>
                             } @else {
                               <div class="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600"></div>
                             }
                             <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ chapter.name }}</span>
                           </div>
                           
                           <div class="flex items-center gap-2">
                              <span class="text-[10px] font-mono text-slate-400">{{ chapter.id }}</span>
                              <!-- Quiz Button -->
                              <button (click)="generateQuiz(chapter.name)" class="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 transition-colors flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                Quiz Me
                              </button>
                           </div>
                        </div>

                        <!-- Resources List -->
                        @if (chapter.resource_links.length > 0) {
                          <div class="ml-7 flex flex-wrap gap-2 mt-2">
                             @for (res of chapter.resource_links; track $index) {
                               <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  <span class="truncate max-w-[150px]">{{ res.file_name }}</span>
                               </div>
                             }
                          </div>
                        }
                     </div>
                   }
                </div>
              }
           </div>
         }
      </div>

      <!-- Upload Toast -->
      @if (lastUploaded()) {
        <div class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 max-w-sm w-full mx-4">
           <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
             <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           </div>
           <div class="flex-1 min-w-0">
              <p class="text-sm font-bold">File Organized!</p>
              <p class="text-xs text-slate-300 truncate">Filed under {{ lastUploaded()?.chapterName }}</p>
           </div>
           <button (click)="lastUploaded.set(null)" class="text-slate-400 hover:text-white">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>
      }
      
      <!-- Quiz Modal (Simple Implementation) -->
      @if (activeQuiz()) {
         <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 h-[500px] flex flex-col">
               <div class="flex justify-between items-center mb-4">
                  <h3 class="font-bold text-lg dark:text-white">Midnight Quiz</h3>
                  <button (click)="activeQuiz.set(null)" class="text-slate-400 hover:text-white">Close</button>
               </div>
               <div class="flex-1 overflow-y-auto space-y-4">
                  @for (q of activeQuiz()?.questions; track q.id) {
                    <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                       <p class="font-medium text-slate-800 dark:text-slate-200 mb-2">{{ q.question }}</p>
                       <div class="space-y-1">
                          @for (opt of q.options; track $index) {
                             <div class="p-2 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer"
                               [class.bg-green-100]="showAnswers() && $index === q.correct_answer_index"
                               [class.dark:bg-green-900]="$index === q.correct_answer_index && showAnswers()">
                               {{ opt }}
                             </div>
                          }
                       </div>
                       @if (showAnswers()) {
                         <p class="text-xs text-emerald-600 mt-2 font-medium">{{ q.explanation }}</p>
                       }
                    </div>
                  }
               </div>
               <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button (click)="showAnswers.set(true)" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Reveal Answers</button>
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

  subjects = ['Physics', 'Chemistry', 'Biology'];
  selectedSubject = signal('Physics');
  selectedClass = signal<11 | 12>(11);
  expandedUnits = signal<Set<string>>(new Set());
  uploading = signal(false);
  lastUploaded = signal<{fileName: string, chapterName: string} | null>(null);
  
  activeQuiz = signal<any>(null);
  showAnswers = signal(false);

  currentUnits = computed(() => {
    const data = this.syllabusService.syllabus().find(
      s => s.subject === this.selectedSubject() && s.class_level === this.selectedClass()
    );
    return data ? data.units : [];
  });

  toggleUnit(unitName: string) {
    this.expandedUnits.update(set => {
      const newSet = new Set(set);
      if (newSet.has(unitName)) newSet.delete(unitName);
      else newSet.add(unitName);
      return newSet;
    });
  }

  isUnitExpanded(unitName: string) {
    return this.expandedUnits().has(unitName);
  }

  async handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploading.set(true);
    
    try {
      const context = this.syllabusService.getAllChapterNames();
      const categorization = await this.gemini.categorizeFile(file.name, context);
      
      if (categorization.chapterId) {
        this.syllabusService.addResource(categorization.chapterId, {
          file_name: file.name,
          file_type: 'Notes',
          upload_date: new Date().toISOString()
        });

        const matchedChapter = context.find(c => c.id === categorization.chapterId);
        if (matchedChapter) {
            this.lastUploaded.set({ fileName: file.name, chapterName: matchedChapter.name });
        }
      } else {
        alert("Could not automatically categorize this file. Please check the filename.");
      }
    } catch (e) {
      console.error(e);
      alert('Error analyzing file.');
    } finally {
      this.uploading.set(false);
    }
  }

  async generateQuiz(chapterName: string) {
    this.uploading.set(true); // Reuse loading spinner logic
    this.showAnswers.set(false);
    try {
      const quiz = await this.gemini.generateChapterQuiz(chapterName);
      this.activeQuiz.set(quiz);
    } catch(e) {
      alert('Failed to generate quiz. Try again.');
    } finally {
      this.uploading.set(false);
    }
  }
}