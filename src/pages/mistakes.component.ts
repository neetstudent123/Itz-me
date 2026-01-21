import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyStore, MistakeEntry } from '../services/study-store.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-mistakes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-10 max-w-5xl mx-auto pb-24 bg-slate-50 dark:bg-slate-900 min-h-full transition-colors">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 class="text-3xl font-bold text-slate-800 dark:text-white">Mistake Notebook</h2>
          <p class="text-slate-500 dark:text-slate-400">"Success consists of going from failure to failure without loss of enthusiasm."</p>
        </div>
        <button (click)="showAddModal.set(true)" class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-200 dark:shadow-none flex items-center gap-2 transition-all hover:scale-105">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           Log New Mistake
        </button>
      </div>

      <!-- Mistake Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         @if (store.mistakeLog().length === 0) {
           <div class="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <div class="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <h3 class="text-xl font-bold text-slate-700 dark:text-slate-200">No mistakes logged yet</h3>
              <p class="text-slate-500 dark:text-slate-400 mt-2">Upload a wrong answer to get AI correction strategies.</p>
           </div>
         }

         @for (entry of store.mistakeLog(); track entry.id) {
           <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
              <div class="flex justify-between items-start mb-3">
                 <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide"
                   [class.bg-orange-50]="entry.analysis.error_category.includes('Conceptual')" [class.text-orange-600]="entry.analysis.error_category.includes('Conceptual')"
                   [class.bg-red-50]="entry.analysis.error_category.includes('Silly')" [class.text-red-600]="entry.analysis.error_category.includes('Silly')"
                   [class.bg-blue-50]="!entry.analysis.error_category.includes('Conceptual') && !entry.analysis.error_category.includes('Silly')" [class.text-blue-600]="!entry.analysis.error_category.includes('Conceptual') && !entry.analysis.error_category.includes('Silly')">
                   {{ entry.analysis.error_category }}
                 </span>
                 <span class="text-xs text-slate-400 font-mono">{{ entry.date | date:'MMM d' }}</span>
              </div>
              
              <h3 class="font-medium text-slate-800 dark:text-white line-clamp-2 mb-3" [title]="entry.questionText">
                 {{ entry.questionText }}
              </h3>

              <div class="space-y-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                 <div>
                    <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Revise Topic</p>
                    <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{{ entry.analysis.root_concept_to_revise }}</p>
                 </div>
                 <div>
                    <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Strategy</p>
                    <p class="text-sm text-slate-600 dark:text-slate-300">{{ entry.analysis.correction_strategy }}</p>
                 </div>
              </div>
           </div>
         }
      </div>

      <!-- Add Mistake Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div class="flex justify-between items-center mb-6">
                 <h3 class="text-xl font-bold text-slate-800 dark:text-white">Analyze Error</h3>
                 <button (click)="showAddModal.set(false)" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>

              <div class="space-y-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Question Text / Description</label>
                    <textarea [(ngModel)]="newMistakeText" rows="3" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none" placeholder="Paste the question or describe what went wrong..."></textarea>
                 </div>
                 
                 <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Or Upload Image</label>
                    <div class="relative">
                       <input type="file" accept="image/*" (change)="handleImage($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                       <div class="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <span>{{ newMistakeImage ? 'Image Selected' : 'Tap to upload screenshot' }}</span>
                       </div>
                    </div>
                 </div>

                 <button 
                   (click)="analyzeAndSave()" 
                   [disabled]="analyzing() || (!newMistakeText && !newMistakeImage)"
                   class="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                   @if (analyzing()) {
                     <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     AI Analyzing...
                   } @else {
                     Analyze & Log Mistake
                   }
                 </button>
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class MistakesComponent {
  store = inject(StudyStore);
  gemini = inject(GeminiService);
  
  showAddModal = signal(false);
  analyzing = signal(false);
  
  newMistakeText = '';
  newMistakeImage: string | null = null;

  handleImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.newMistakeImage = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  async analyzeAndSave() {
    this.analyzing.set(true);
    try {
      const imageBase64 = this.newMistakeImage ? this.newMistakeImage.split(',')[1] : undefined;
      const analysis = await this.gemini.analyzeMistake(this.newMistakeText, imageBase64);
      
      const entry: MistakeEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        questionText: this.newMistakeText || 'Image Question',
        questionImage: this.newMistakeImage || undefined,
        analysis: analysis
      };

      this.store.addMistake(entry);
      this.showAddModal.set(false);
      this.resetForm();
    } catch (e) {
      alert('Failed to analyze. Please try again.');
    } finally {
      this.analyzing.set(false);
    }
  }

  resetForm() {
    this.newMistakeText = '';
    this.newMistakeImage = null;
  }
}