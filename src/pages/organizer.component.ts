
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
    <div class="flex flex-col h-full bg-slate-100 dark:bg-slate-950 transition-colors overflow-hidden relative">
      
      <!-- Top Search Bar (Global Access) -->
      <div class="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20 shadow-sm">
        <div class="max-w-3xl mx-auto w-full relative">
           <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <input 
             type="text" 
             [(ngModel)]="searchQuery" 
             (ngModelChange)="onSearch()"
             placeholder="Search chapters (e.g., 'Plant Kingdom')" 
             class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-inner"
           >
           @if (searchQuery.length > 0 && searchResults().length > 0 && activeChapter()) {
              <!-- Small Dropdown hint only if looking at a chapter -->
              <div class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto z-50">
                 @for (result of searchResults(); track result.id) {
                   <button (click)="openChapterById(result.id)" class="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex justify-between items-center group transition-colors">
                      <span class="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{{ result.name }}</span>
                      <span class="text-xs uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{{ result.subject }}</span>
                   </button>
                 }
              </div>
           }
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 relative">
        
        <!-- View 0: Search Results (Global) -->
        @if (searchQuery.length > 0 && !activeChapter()) {
           <div class="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
              <h2 class="text-xl font-bold text-slate-800 dark:text-white">Search Results</h2>
              @if (searchResults().length === 0) {
                 <div class="text-center py-10 text-slate-500">
                    No chapters found matching "{{ searchQuery }}"
                 </div>
              }
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 @for (result of searchResults(); track result.id) {
                    <button (click)="openChapterById(result.id)" class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all text-left group">
                       <div class="flex justify-between items-start">
                          <h3 class="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ result.name }}</h3>
                          <span class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">{{ result.subject }}</span>
                       </div>
                       <p class="text-sm text-slate-400 mt-2">Tap to open chamber</p>
                    </button>
                 }
              </div>
           </div>
        }

        <!-- View 1: Subject Browser (When no chapter active AND no search) -->
        @if (!activeChapter() && searchQuery.length === 0) {
          <div class="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
             <div class="text-center py-8">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Resource Vault</h2>
                <p class="text-slate-500 dark:text-slate-400">Select a subject to browse units or use search above.</p>
             </div>

             <!-- Subject Tabs -->
             <div class="flex justify-center gap-4">
              @for (sub of subjects; track sub) {
                <button (click)="activeSubject.set(sub)" 
                  class="px-6 py-3 rounded-2xl border-2 transition-all font-bold shadow-sm hover:scale-105 active:scale-95"
                  [class.border-indigo-600]="activeSubject() === sub"
                  [class.bg-indigo-600]="activeSubject() === sub"
                  [class.text-white]="activeSubject() === sub"
                  [class.border-white]="activeSubject() !== sub"
                  [class.bg-white]="activeSubject() !== sub"
                  [class.text-slate-600]="activeSubject() !== sub"
                  [class.dark:bg-slate-800]="activeSubject() !== sub"
                  [class.dark:text-slate-300]="activeSubject() !== sub"
                  [class.dark:border-slate-700]="activeSubject() !== sub">
                  {{ sub }}
                </button>
              }
            </div>

            <!-- Units Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               @for (unit of filteredUnits(); track unit.name) {
                 <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <h3 class="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                       <span class="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                       {{ unit.name }}
                    </h3>
                    <div class="space-y-1">
                       @for (chapter of unit.chapters; track chapter.id) {
                         <button (click)="openChapter(chapter)" class="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-300 transition-colors flex justify-between items-center group">
                            <span class="truncate">{{ chapter.name }}</span>
                            <svg class="w-4 h-4 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                         </button>
                       }
                    </div>
                 </div>
               }
            </div>
          </div>
        }

        <!-- View 2: The "Central Chamber" (Active Chapter) -->
        @if (activeChapter()) {
          <div class="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
             
             <!-- Chamber Header -->
             <div class="flex items-center gap-4 mb-6">
                <button (click)="navigate('root')" class="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div>
                   <h2 class="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{{ activeChapter()?.name }}</h2>
                   <p class="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded w-fit mt-1">CHAMBER ID: {{ activeChapter()?.id }}</p>
                </div>
             </div>

             <!-- THE CENTRAL CHAMBER CARD -->
             <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                
                <!-- 1. Tools Sub-Chamber (Top Section) -->
                <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                   <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Command Center</h3>
                   
                   <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <!-- Tool: Mistake Diary -->
                      <button (click)="openMistakeLogger()" class="relative overflow-hidden group bg-white dark:bg-slate-700 p-4 rounded-2xl border border-rose-100 dark:border-rose-900 shadow-sm hover:shadow-md transition-all text-left">
                         <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500">
                            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                         </div>
                         <div class="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span class="font-bold">Mistakes</span>
                         </div>
                         <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ chapterMistakes().length }}</p>
                         <p class="text-xs text-slate-500 mt-1">Logged errors</p>
                      </button>

                      <!-- Tool: Analysis -->
                      <button (click)="runAnalysis()" [disabled]="analyzing() || currentFiles().length === 0" class="relative overflow-hidden group bg-white dark:bg-slate-700 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all text-left disabled:opacity-50">
                         <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-indigo-500">
                            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 00-2-2H3zm11 4a1 1 0 10-2 0 1 1 0 002 0zm-1 2.414L10.586 11H12v-.586z" clip-rule="evenodd"></path></svg>
                         </div>
                         <div class="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                            @if(analyzing()) {
                              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            } @else {
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            }
                            <span class="font-bold">Health Report</span>
                         </div>
                         <p class="text-xs text-slate-500 mt-1">
                           {{ lastAnalysis() ? 'Report Ready' : 'Analyze Content' }}
                         </p>
                      </button>

                      <!-- Tool: Quiz -->
                      <button (click)="startQuiz()" [disabled]="!lastAnalysis()" class="relative overflow-hidden group bg-white dark:bg-slate-700 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900 shadow-sm hover:shadow-md transition-all text-left disabled:opacity-50">
                         <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                             <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>
                         </div>
                         <div class="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            <span class="font-bold">Take Quiz</span>
                         </div>
                         <p class="text-xs text-slate-500 mt-1">Test Retention</p>
                      </button>
                   </div>
                </div>

                <!-- 2. Files Sub-Chamber (Bottom Section) -->
                <div class="p-6">
                   <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">File Vault</h3>
                      
                      <!-- Local File Search -->
                      <div class="relative w-full md:w-64">
                         <input type="text" [(ngModel)]="fileSearch" placeholder="Filter files inside {{activeChapter()?.name}}..." 
                           class="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border-none text-sm focus:ring-1 focus:ring-indigo-500">
                         <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                   </div>

                   <!-- File Categories Grid -->
                   <div class="grid grid-cols-1 gap-4">
                      @for (cat of fileCategories; track cat) {
                        <div class="border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                           <div class="flex justify-between items-center mb-3">
                              <div class="flex items-center gap-2">
                                 <div class="w-2 h-8 rounded-full" 
                                   [class.bg-blue-500]="cat === 'Notes'"
                                   [class.bg-amber-500]="cat === 'PYQ'"
                                   [class.bg-purple-500]="cat === 'Formula'"
                                   [class.bg-rose-500]="cat === 'Mind Maps'"
                                   [class.bg-teal-500]="cat === 'Solutions'"></div>
                                 <h4 class="font-bold text-slate-700 dark:text-slate-200">{{ cat }}</h4>
                                 
                                 <!-- Success Indicator -->
                                 @if (filteredFiles(cat).length > 0) {
                                    <div class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-0.5 ml-1">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                 }
                              </div>
                              <label class="cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                 <svg *ngIf="!uploading()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                 <svg *ngIf="uploading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                 Upload
                                 <input type="file" class="hidden" (change)="handleUpload($event, cat)">
                              </label>
                           </div>

                           <div class="space-y-2">
                              @for (file of filteredFiles(cat); track file.id) {
                                <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-sm group hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                                   <div class="flex items-center gap-3 overflow-hidden">
                                      <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                      <span class="truncate text-slate-700 dark:text-slate-300 font-medium">{{ file.fileName }}</span>
                                      <span class="text-[10px] text-slate-400">{{ (file.size / 1024).toFixed(0) }} KB</span>
                                   </div>
                                   <button (click)="deleteFile(file.id)" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                   </button>
                                </div>
                              }
                              @if (filteredFiles(cat).length === 0) {
                                 <div class="text-center py-4 text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                   No files found in {{ cat }}
                                 </div>
                              }
                           </div>
                        </div>
                      }
                   </div>
                </div>
             </div>

             <!-- Analysis Results Drawer -->
             @if (lastAnalysis()) {
               <div class="mt-6 animate-in slide-in-from-bottom-5 duration-500">
                  <div class="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                     <div class="absolute inset-0 bg-indigo-600/50 blur-3xl"></div>
                     <div class="relative z-10">
                        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                           <svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                           AI Health Report
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <h4 class="text-xs font-bold text-indigo-200 uppercase mb-2">Missing Concepts</h4>
                              <ul class="space-y-1">
                                 @for (c of lastAnalysis().missing_concepts; track $index) {
                                   <li class="flex items-start gap-2 text-sm text-indigo-50">
                                     <span class="text-rose-400">•</span> {{ c }}
                                   </li>
                                 }
                              </ul>
                           </div>
                           <div class="bg-white/10 rounded-xl p-4 border border-white/10">
                              <div class="flex justify-between items-center mb-2">
                                 <span class="text-sm font-medium">Mastery Score</span>
                                 <span class="text-xl font-bold">{{ lastAnalysis().mastery_percentage }}%</span>
                              </div>
                              <div class="w-full bg-black/20 rounded-full h-2">
                                 <div class="bg-emerald-400 h-2 rounded-full transition-all duration-1000" [style.width.%]="lastAnalysis().mastery_percentage"></div>
                              </div>
                              <button (click)="startQuiz()" class="w-full mt-4 py-2 bg-white text-indigo-900 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                                 Attempt Remedial Quiz
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             }
          </div>
        }
      </div>

      <!-- Modals (Mistake & Quiz) - Reused Logic -->
      @if (showMistakeModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
           <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
              <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">Log Mistake</h3>
              <textarea [(ngModel)]="mistakeText" rows="5" class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-white placeholder-slate-400 resize-none text-base" placeholder="Describe the question and your error..."></textarea>
              <div class="mt-6 flex gap-3">
                 <button (click)="showMistakeModal.set(false)" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                 <button (click)="saveMistake()" [disabled]="!mistakeText || analyzing()" class="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-50">
                    {{ analyzing() ? 'Analyzing...' : 'Save to Diary' }}
                 </button>
              </div>
           </div>
        </div>
      }

      @if (showQuiz() && lastAnalysis()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col shadow-2xl border border-white/10">
              <div class="flex justify-between items-center mb-6 shrink-0">
                 <h3 class="font-bold text-xl dark:text-white">Generated Quiz</h3>
                 <button (click)="showQuiz.set(false)" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              <div class="flex-1 overflow-y-auto space-y-8 pr-2">
                 @for (q of lastAnalysis().quick_quiz; track $index) {
                   <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div class="flex gap-3 mb-3">
                         <span class="font-bold text-indigo-500">Q{{$index + 1}}.</span>
                         <p class="font-medium text-slate-800 dark:text-slate-200">{{ q.question }}</p>
                      </div>
                      <div class="space-y-2 pl-8">
                         @for (opt of q.options; track optIdx) {
                            <div class="p-3 border rounded-xl text-sm cursor-pointer transition-all"
                              [class.border-slate-200]="!quizRevealed()"
                              [class.dark:border-slate-700]="!quizRevealed()"
                              [class.hover:bg-indigo-50]="!quizRevealed()"
                              [class.dark:hover:bg-slate-700]="!quizRevealed()"
                              [class.bg-emerald-100]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.border-emerald-200]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.text-emerald-800]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.dark:bg-emerald-900/30]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.dark:border-emerald-800]="quizRevealed() && optIdx === q.correct_answer_index"
                              [class.dark:text-emerald-300]="quizRevealed() && optIdx === q.correct_answer_index">
                              {{ opt }}
                            </div>
                         }
                      </div>
                      @if (quizRevealed()) {
                        <div class="mt-3 pl-8 text-sm text-slate-500 dark:text-slate-400 italic">
                           💡 {{ q.explanation }}
                        </div>
                      }
                   </div>
                 }
              </div>
              <div class="pt-6 mt-2 shrink-0">
                 <button (click)="quizRevealed.set(true)" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">Reveal Answers</button>
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
  
  // Expanded Categories for "Two more chambers"
  fileCategories = ['Notes', 'PYQ', 'Formula', 'Mind Maps', 'Solutions'];

  // Search State
  searchQuery = '';
  // Simple search filter for dropdown and main view
  searchResults = computed(() => {
     if (!this.searchQuery) return [];
     const term = this.searchQuery.toLowerCase();
     // Search across ALL subjects
     return this.syllabusService.getAllChapterNames()
        .filter(c => c.name.toLowerCase().includes(term));
  });

  // File State
  currentFiles = signal<StoredFile[]>([]);
  fileSearch = ''; // Local file filter
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

  filteredFiles(cat: string) {
     let files = this.currentFiles().filter(f => f.category === cat);
     if (this.fileSearch) {
        const term = this.fileSearch.toLowerCase();
        files = files.filter(f => f.fileName.toLowerCase().includes(term));
     }
     return files;
  }

  navigate(to: string) {
    if (to === 'root') {
      this.activeChapter.set(null);
      this.searchQuery = '';
    }
  }

  async openChapter(chapter: any) {
    this.activeChapter.set(chapter);
    this.lastAnalysis.set(null); 
    this.searchQuery = ''; // Clear global search on open
    this.fileSearch = '';
    await this.refreshFiles(chapter.id);
  }

  // Opens chapter from search result
  async openChapterById(id: string) {
    const allData = this.syllabusService.syllabus();
    let foundChapter = null;
    
    for (const group of allData) {
       for (const unit of group.units) {
          const c = unit.chapters.find(x => x.id === id);
          if (c) {
             foundChapter = c;
             // Also switch active subject tab to match
             this.activeSubject.set(group.subject);
             break;
          }
       }
       if (foundChapter) break;
    }

    if (foundChapter) {
       await this.openChapter(foundChapter);
    }
  }

  async refreshFiles(chapterId: string) {
    const files = await this.db.getFilesByChapter(chapterId);
    this.currentFiles.set(files);
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
  
  onSearch() {
     // If user is inside a chamber, search might be filtered differently if we wanted
     // But for now, if they type in global search, we let them see search results
     // The template handles the view switching logic: @if (searchQuery.length > 0 && !activeChapter())
     // If they are in activeChapter, the dropdown appears.
     // To force main view search, user would need to navigate back or we'd auto-navigate. 
     // We'll keep it simple: Type -> Dropdown if active, View if inactive. 
     // If user wants to search globally from active, they can click 'X' to close active or just use dropdown.
  }
}
