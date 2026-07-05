// Types and constants for Learn Spanish Numbers (web)

export const VOICE_OPTIONS = [
  { id: 'es', name: 'Spanish (Spain)' },
  { id: 'es-MX', name: 'Spanish (Mexico)' },
];

export const TRICKY_NUMBERS = new Set([15,16,17,18,19,20,22,23,24,25,26,27,28,29,32,33,34,35,36,37,38,39,42,43,44,45,46,47,48,49,52,53,54,55,56,57,58,59,62,63,64,65,66,67,68,69,72,73,74,75,76,77,78,79,82,83,84,85,86,87,88,89,92,93,94,95,96,97,98,99,100,1000]);

export type PanelId = 'home' | 'cram' | 'listen-learn' | 'number-to-spanish';

export interface FocusedRangePreset {
  id: string;
  label: string;
  description: string;
  ranges: string;
  compactLabel?: string;
}

export const FOCUSED_RANGE_PRESETS: FocusedRangePreset[] = [
  { id: 'basics', label: 'Basics', description: '1 to 10', ranges: '1-10', compactLabel: '1-10' },
  { id: 'teens', label: 'Teens', description: '11 to 19', ranges: '11-19', compactLabel: '11-19' },
  { id: 'twenties', label: '20s', description: '20 to 29', ranges: '20-29', compactLabel: '20-29' },
  { id: 'tens', label: '30s-90s', description: 'Decade patterns from 30 to 99', ranges: '30-99', compactLabel: '30-99' },
  { id: 'hundreds', label: 'Hundreds', description: '100 to 130', ranges: '100-130', compactLabel: '100-130' },
  { id: 'thousands', label: 'Thousands', description: '1,000 to 10,000 plus 1,000-1,039', ranges: '1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 1000-1039', compactLabel: '1000 + 1001-1039' },
  { id: 'big', label: 'Big Numbers', description: '100,000, 1,000,000, and 1,000,000,000', ranges: '100000, 1000000, 1000000000', compactLabel: '100k / 1M / 1B' },
  { id: 'tricky', label: 'Tricky', description: 'Commonly confusing forms', ranges: Array.from(TRICKY_NUMBERS).join(', '), compactLabel: 'Tricky set' },
];

export interface AppSettings {
  audioEnabled: boolean;
  voiceId: string;
  lastCramRanges: string;
  cramRecentConfigs: CramRecentConfig[];
  listenLearnSettings: ListenLearnSettings;
}

export interface CramRecentConfig {
  inputText: string;
  shuffled: boolean;
  usedAt: string;
}

export interface ListenLearnSettings {
  direction: 'es-en' | 'en-es' | 'es-only';
  inputText: string;
  shuffled: boolean;
  autoRepeatRange: boolean;
  recentConfigs: ListenLearnRecentConfig[];
}

export interface ListenLearnRecentConfig {
  inputText: string;
  direction: 'es-en' | 'en-es' | 'es-only';
  shuffled: boolean;
  usedAt: string;
}

export interface ListenLearnState {
  numbers: number[];
  currentIndex: number;
  showingAnswer: boolean;
  inputText: string;
  direction: 'es-en' | 'en-es' | 'es-only';
  shuffled: boolean;
  autoRepeatRange: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  audioEnabled: true,
  voiceId: 'es',
  lastCramRanges: '',
  cramRecentConfigs: [],
  listenLearnSettings: { direction: 'es-en', inputText: '', shuffled: false, autoRepeatRange: false, recentConfigs: [] },
};
