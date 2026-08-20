export type SourceType = 'document' | 'youtube';

export interface ChatSource {
  type: SourceType;
  name: string;
  /** For youtube, the video ID */
  videoId?: string;
  /** file size label for documents */
  size?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  source: ChatSource;
  messages: ChatMessage[];
  createdAt: number;
}

export const SUGGESTED_QUESTIONS = [
  'Summarize this document',
  'What are the key points?',
  'Explain this simply',
  'Create notes',
  'Ask questions from this document',
] as const;
