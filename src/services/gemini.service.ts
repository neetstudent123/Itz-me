import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  // Routine Generation using Structured Output
  async generateDailyRoutine(profile: any, focus: string): Promise<any> {
    try {
      // Instruction-First Prompting to reduce latency
      const prompt = `ROLE: Elite NEET Exam Strategist & Performance Coach.
TASK: Construct a hyper-optimized daily study schedule.
INPUTS:
- Student Profile: ${JSON.stringify(profile)}
- Target Focus Areas: ${focus}
- Optimization Parameters:
  1. Backlog Management: Allocate time for backlog clearance based on identified weaknesses.
  2. Study Technique: Utilize Active Recall & Spaced Repetition (Interleaving subjects).
  3. Intensity: High (Competitive exam level).
  4. Break Strategy: Scientific (short breaks for cognitive reset).
OUTPUT REQUIREMENT: Return strictly JSON.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              motivation_quote: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time_start: { type: Type.STRING },
                    time_end: { type: Type.STRING },
                    activity: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Study', 'Break', 'Revision', 'MockTest'] },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error('Routine Gen Error', e);
      throw e;
    }
  }

  // Streaming Chat for Low Latency
  async *chatWithTutorStream(history: any[], message: string, imageBase64?: string): AsyncGenerator<string> {
    const model = 'gemini-2.5-flash';
    const parts: any[] = [{ text: message }];
    
    if (imageBase64) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg for simplicity, in production detect mime
          data: imageBase64
        }
      });
    }

    const chat: Chat = this.ai.chats.create({
      model: model,
      history: history,
      config: {
        // Optimized system instruction
        systemInstruction: "ROLE: Expert NEET Tutor. METHOD: Socratic & Feynman. GOAL: Explain concepts simply. Solve problems step-by-step."
      }
    });

    // Fix: Use 'message' property instead of 'parts'
    const resultStream = await chat.sendMessageStream({ message: parts });
    
    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  // Fallback non-streaming (kept for compatibility if needed, but stream preferred)
  async chatWithTutor(history: any[], message: string, imageBase64?: string): Promise<string> {
    let text = '';
    const stream = this.chatWithTutorStream(history, message, imageBase64);
    for await (const chunk of stream) {
      text += chunk;
    }
    return text;
  }

  // Deep Thinking Mode for Complex Physics/Chem Problems
  async deepThinkSolve(problemText: string): Promise<string> {
    // gemini-2.5-flash supports thinking now via config if enabled, but using specific instructions for "Deep Think" behavior
    // Using a rigorous instruction set instead of 'thinkingConfig' which might be model-specific/preview.
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `TASK: Solve this complex NEET problem.
METHOD: Chain-of-Thought.
REQUIREMENT: Step-by-step rigor. Identify physical principles first.
PROBLEM: ${problemText}`
    });
    return response.text;
  }

  // Search Grounding for Exam News
  async getExamUpdates(): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash', // Switched to 2.5 flash for speed/consistency
      contents: "Latest official NTA updates for NEET 2025 exam dates and news.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "No updates found.";
  }

  // AI File Categorization for Smart Organizer
  async categorizeFile(filename: string, syllabusContext: any[]): Promise<{ chapterId: string, confidence: number }> {
    try {
      const prompt = `TASK: Map the uploaded filename to the correct NEET Syllabus Chapter ID.
CONTEXT: List of valid Chapters: ${JSON.stringify(syllabusContext)}
FILENAME: "${filename}"
INSTRUCTION: 
1. Analyze the filename for keywords (e.g., 'Kinematics', 'Bonding', 'Human Repro').
2. Match it to the closest Chapter ID from the Context.
3. If uncertain, return the 'General' or closest unit match.
OUTPUT: JSON with 'chapterId' and 'confidence' (0-1).`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chapterId: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error('Categorization Error', e);
      return { chapterId: '', confidence: 0 };
    }
  }
}