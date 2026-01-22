
import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface StoredFile {
  id: string;
  chapterId: string;
  category: 'Notes' | 'PYQ' | 'Formula' | 'Mind Maps' | 'Solutions';
  fileName: string;
  fileType: string;
  uploadDate: string;
  extractedText: string; 
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private dbName = 'NeetVaultDB';
  private dbVersion = 1;
  private storeName = 'files';
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    // Fix for: Cannot set properties of undefined (setting 'workerSrc')
    // Handle both ESM and CJS interop for pdfjs-dist
    try {
      // safe check for window context
      if (typeof window !== 'undefined') {
         const pdfJs = (pdfjsLib as any).default || pdfjsLib;
         if (pdfJs && pdfJs.GlobalWorkerOptions) {
           pdfJs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
         }
      }
    } catch (e) {
      console.warn('PDF.js init warning:', e);
    }
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('chapterId', 'chapterId', { unique: false });
        }
      };
    });
  }

  async saveFile(file: StoredFile): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(file);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFilesByChapter(chapterId: string): Promise<StoredFile[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('chapterId');
      const request = index.getAll(chapterId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Text Extraction Logic ---

  async extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return this.extractPdfText(file);
    } else if (file.type.startsWith('text/')) {
      return file.text();
    }
    return ''; // Image OCR would require Tesseract.js, skipping for strictly PDF/Text requirement
  }

  private async extractPdfText(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Access library safely
        const pdfJs = (pdfjsLib as any).default || pdfjsLib;
        
        const loadingTask = pdfJs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        // Limit to first 20 pages to avoid OOM on massive books during quick extraction
        const maxPages = Math.min(pdf.numPages, 20);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += ` [Page ${i}] ${pageText}`;
        }
        
        return fullText;
    } catch (e) {
        console.error("PDF Extraction failed", e);
        return "Error extracting text";
    }
  }
}
