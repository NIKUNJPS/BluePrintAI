export enum AppMode {
  DEEP_INTAKE = 'DEEP_INTAKE',
  QUICK_SCAN = 'QUICK_SCAN',
  CHAT = 'CHAT'
}

export interface Attachment {
  name?: string;
  mimeType: string;
  data: string; // base64 encoded string
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}