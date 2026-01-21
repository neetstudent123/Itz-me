import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  isThinking?: boolean;
}

@Component({
  selector: 'app-tutor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white relative pb-[72px] md:pb-0">
      <!-- Header -->
      <div class="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0 z-10">
        <div>
           <h2 class="font-bold text-slate-800">AI Mentor</h2>
           <p class="text-xs text-slate-400">Socratic Mode • Feynman Technique</p>
        </div>
        <div class="flex items-center gap-2">
           <button (click)="toggleThinkingMode()" 
              [class.bg-purple-100]="thinkingMode()" [class.text-purple-700]="thinkingMode()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              {{ thinkingMode() ? 'Deep Think: ON' : 'Deep Think: OFF' }}
           </button>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" #chatContainer>
         @if (messages().length === 0) {
           <div class="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
              <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                 <svg class="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
              <h3 class="text-lg font-medium text-slate-700">How can I help you ace NEET?</h3>
              <p class="text-slate-400 text-sm mt-2 max-w-xs">Ask about Physics concepts, upload a Biology diagram, or get a Chemistry problem solved.</p>
           </div>
         }

         @for (msg of messages(); track $index) {
           <div class="flex gap-4" [class.flex-row-reverse]="msg.role === 'user'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                [class.bg-indigo-600]="msg.role === 'user'" 
                [class.bg-emerald-500]="msg.role === 'model'">
                 @if (msg.role === 'user') {
                   <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                 } @else {
                   <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                 }
              </div>
              
              <div class="max-w-[80%] space-y-2">
                 @if (msg.image) {
                   <img [src]="msg.image" class="max-w-xs rounded-lg border border-slate-200 shadow-sm" alt="Uploaded content">
                 }
                 <div class="p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap"
                    [class.bg-indigo-600]="msg.role === 'user'" 
                    [class.text-white]="msg.role === 'user'"
                    [class.rounded-tr-none]="msg.role === 'user'"
                    [class.bg-white]="msg.role === 'model'"
                    [class.text-slate-700]="msg.role === 'model'"
                    [class.rounded-tl-none]="msg.role === 'model'"
                    [class.border]="msg.role === 'model'"
                    [class.border-slate-200]="msg.role === 'model'">
                    @if (msg.isThinking) {
                       <div class="flex items-center gap-2 text-slate-400 italic">
                         <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Thinking deeply...
                       </div>
                    } @else {
                      {{ msg.text }}
                    }
                 </div>
              </div>
           </div>
         }
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white border-t border-slate-200">
         <div class="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <button (click)="fileInput.click()" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </button>
            <input #fileInput type="file" accept="image/*" class="hidden" (change)="handleImageUpload($event)">
            
            <textarea [(ngModel)]="inputMessage" (keydown.enter.prevent)="sendMessage()" rows="1" class="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-slate-700 placeholder:text-slate-400 max-h-32" placeholder="Ask a doubt..."></textarea>
            
            <button (click)="sendMessage()" [disabled]="!inputMessage.trim() && !selectedImage" class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
         </div>
         @if (selectedImage) {
           <div class="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded">
              <span>Image attached</span>
              <button (click)="selectedImage = null" class="text-slate-400 hover:text-red-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
           </div>
         }
      </div>
    </div>
  `
})
export class TutorComponent {
  gemini = inject(GeminiService);
  messages = signal<Message[]>([]);
  inputMessage = '';
  selectedImage: string | null = null;
  thinkingMode = signal(false);

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  toggleThinkingMode() {
    this.thinkingMode.update(v => !v);
  }

  handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async sendMessage() {
    if (!this.inputMessage.trim() && !this.selectedImage) return;

    const userText = this.inputMessage;
    const userImage = this.selectedImage;
    
    // Reset inputs
    this.inputMessage = '';
    this.selectedImage = null;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text: userText, image: userImage || undefined }]);
    this.scrollToBottom();

    try {
      if (this.thinkingMode()) {
        // Deep Think Mode (Non-streaming for complex reasoning blocks for now)
        this.messages.update(msgs => [...msgs, { role: 'model', text: '', isThinking: true }]);
        
        const fullPrompt = userImage 
           ? `[Image Analyzed] ${userText}` 
           : userText;
        const responseText = await this.gemini.deepThinkSolve(fullPrompt);
        
        this.messages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs.pop(); // Remove thinking placeholder
          newMsgs.push({ role: 'model', text: responseText });
          return newMsgs;
        });

      } else {
        // Standard Chat - Streaming Mode
        const history = this.messages()
          .slice(0, -1) // Exclude the just added user message
          .filter(m => !m.isThinking && m.text.trim().length > 0) // IMPORTANT: Filter empty messages to prevent API errors
          .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        
        // Add empty model message for streaming
        this.messages.update(msgs => [...msgs, { role: 'model', text: '' }]);
        
        const stream = this.gemini.chatWithTutorStream(history, userText, userImage ? userImage.split(',')[1] : undefined);
        
        let accumulatedText = '';
        for await (const chunk of stream) {
          accumulatedText += chunk;
          
          this.messages.update(msgs => {
             const copy = [...msgs];
             const lastMsg = copy[copy.length - 1];
             if (lastMsg.role === 'model') {
               lastMsg.text = accumulatedText;
             }
             return copy;
          });
          this.scrollToBottom();
        }
      }
      
    } catch (err) {
      console.error('Gemini Chat Error:', err); // Log error for debugging
      this.messages.update(msgs => {
        const newMsgs = [...msgs.filter(m => !m.isThinking)];
        // If last message was partial model response, keep it or append error? 
        // For simplicity, append error message.
        newMsgs.push({ role: 'model', text: "I'm having trouble connecting to the neural network. Please try again later." });
        return newMsgs;
      });
    } finally {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}