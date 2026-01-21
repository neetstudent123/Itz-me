
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

  // 1. Routine Generation with Chronotype Logic
  async generateDailyRoutine(profile: any, focus: string): Promise<any> {
    try {
      // Logic: Peak Energy vs Slump based on Chronotype
      const peakHours = profile.chronotype === 'EarlyBird' ? '05:00 - 11:00' : '20:00 - 01:00';
      const slumpHours = profile.chronotype === 'EarlyBird' ? '14:00 - 16:00' : '06:00 - 09:00';

      const prompt = `ROLE: Expert NEET Exam Strategist.
TASK: Construct a daily schedule optimized for a '${profile.chronotype}' chronotype.
INPUTS:
- Profile: ${JSON.stringify(profile)}
- Focus: ${focus}
- Peak Energy Hours: ${peakHours} (Schedule High-Weightage Physics/Chem here).
- Slump Hours: ${slumpHours} (Schedule Passive Biology Reading here).
- Optimization Rules:
  1. Interleave subjects to prevent cognitive fatigue.
  2. Include short "Micro-Breaks".
OUTPUT: JSON Schedule only.`;

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

  // 2. Mistake Notebook Analysis (Enhanced Error Analyst)
  async analyzeMistake(errorText: string, imageBase64?: string): Promise<any> {
    try {
      const parts: any[] = [];
      if (imageBase64) {
        parts.push({
          inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
        });
      }
      parts.push({
        text: `ROLE: AI Error Analyst for NEET.
TASK: Analyze this wrong answer.
INPUT: Question text/image.
OUTPUT JSON:
- error_category: 'Conceptual Gap', 'Silly Mistake', 'Time Pressure', or 'Knowledge Void'.
- root_concept_to_revise: Specific NCERT topic/paragraph.
- correction_strategy: 1-sentence actionable advice (Socratic tone).
- similar_question_clue: A hint for a similar problem to test retention.`
      });

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              error_category: { type: Type.STRING },
              root_concept_to_revise: { type: Type.STRING },
              correction_strategy: { type: Type.STRING },
              similar_question_clue: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error('Mistake Analysis Error', e);
      throw e;
    }
  }

  // 3. Automated Active Recall (10 Questions Midnight Quiz)
  async generateChapterQuiz(chapterName: string): Promise<any> {
    try {
      const prompt = `ROLE: NEET Quiz Master.
TASK: Generate 10 High-Yield MCQs for '${chapterName}'.
STYLE: 
- 4 Easy (Direct NCERT lines)
- 3 Medium (Statement/Assertion-Reason)
- 3 Hard (Multi-concept application)
OUTPUT: JSON Array of questions.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer_index: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error('Quiz Gen Error', e);
      throw e;
    }
  }

  // 4. Dynamic Backlog Killer (Adaptive Rescheduler)
  async replanBacklogs(pendingTasks: string[], currentProfile: any): Promise<any> {
     const prompt = `ROLE: Adaptive Scheduler.
TASK: Redistribute these backlog tasks: ${JSON.stringify(pendingTasks)}.
STRATEGY:
1. Break large chapters into 30-minute "Micro-Blocks".
2. Prioritize by NEET Weightage (e.g., Mechanics > Units & Dimensions).
3. Do not overwhelm: Spread over next 3 days.
OUTPUT: JSON list of micro-tasks with 'priority' (High/Med/Low).`;
    
    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task_name: { type: Type.STRING },
                        duration_minutes: { type: Type.INTEGER },
                        priority: { type: Type.STRING },
                        suggested_day_offset: { type: Type.INTEGER, description: "0 for today, 1 for tomorrow" }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text);
  }

  // 5. Chapter Health Report (Vault Analysis)
  async generateChapterHealthReport(extractedText: string, chapterName: string): Promise<any> {
    const prompt = `ROLE: NEET Prep Auditor.
TASK: Analyze the student's extracted notes/resources for '${chapterName}'.
INPUT CONTENT: "${extractedText.substring(0, 30000)}..." (Truncated for token limit)
COMPARE AGAINST: Standard NCERT NEET Syllabus for ${chapterName}.
OUTPUT JSON:
- mastery_percentage: 0-100 score based on coverage depth.
- missing_concepts: List of 3-5 key NCERT terms/concepts NOT found or weakly covered in the input.
- quick_quiz: 5 MCQs based strictly on the INPUT CONTENT to test retention of their own notes.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mastery_percentage: { type: Type.INTEGER },
            missing_concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            quick_quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct_answer_index: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }

  // 6. Cognitive Priming (Pre-Study Focus Anchor)
  async generatePriming(topic: string, subject: string): Promise<any> {
    const prompt = `ROLE: Cognitive Performance Coach.
TASK: Generate 3 curiosity-inducing "Priming Anchors" (Fascinating facts or paradoxes) for the topic '${topic}' in '${subject}'.
GOAL: Trigger dopamine and focus before the student starts studying.
OUTPUT: JSON { anchors: string[], micro_challenge: string (A tiny 2-min task to start) }`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             anchors: { type: Type.ARRAY, items: { type: Type.STRING } },
             micro_challenge: { type: Type.STRING }
           }
        }
      }
    });
    return JSON.parse(response.text);
  }

  // Chat Helpers (Existing)
  async *chatWithTutorStream(history: any[], message: string, imageBase64?: string): AsyncGenerator<string> {
    const model = 'gemini-2.5-flash';
    const parts: any[] = [{ text: message }];
    if (imageBase64) {
      parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 }});
    }
    const chat: Chat = this.ai.chats.create({
      model: model,
      history: history,
      config: { systemInstruction: "ROLE: Expert NEET Tutor. METHOD: Socratic. GOAL: Explain simply." }
    });
    const resultStream = await chat.sendMessageStream({ message: parts });
    for await (const chunk of resultStream) {
      if (chunk.text) yield chunk.text;
    }
  }

  async deepThinkSolve(problemText: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `TASK: Solve complex NEET problem. METHOD: Chain-of-Thought. PROBLEM: ${problemText}`
    });
    return response.text;
  }

  async getExamUpdates(): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Latest official NTA updates for NEET 2025.",
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "No updates found.";
  }

  async categorizeFile(filename: string, syllabusContext: any[]): Promise<{ chapterId: string, confidence: number }> {
    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `TASK: Map '${filename}' to a Chapter ID from: ${JSON.stringify(syllabusContext)}. OUTPUT: JSON {chapterId, confidence}.`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
  }
}
