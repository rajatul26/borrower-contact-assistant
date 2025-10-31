import type { ReactNode } from 'react';

export type FolderSummary = {
  id: string;
  name: string;
};

export type CaseSummary = {
  id: string;
  title: string;
  status: string;
  folderId: string | null;
  createdAt?: string;
};

export type CandidateSource =
  | {
      type: 'doc';
      docId: string;
      page?: number;
      snippet?: string;
    }
  | {
      type: 'web';
      url?: string;
      snippet?: string;
    }
  | {
      type?: string;
      [key: string]: unknown;
    };

export type PhoneCandidate = {
  number: string;
  kind?: string;
  via?: string;
  confidence?: number;
  source?: CandidateSource;
};

export type UploadedDocument = {
  id: string;
  name: string;
  pages: number;
  scanned?: boolean;
  file?: File | null;
  url?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStep: string;
  stepIndex: number;
  steps: string[];
};

export type ChatMessage = {
  who: 'bot' | 'user';
  text: string;
  actions?: ReactNode;
};

export type WebLookupStatus =
  | { state: 'idle' }
  | { state: 'loading'; message?: string }
  | { state: 'success'; total: number }
  | { state: 'error'; message?: string };
