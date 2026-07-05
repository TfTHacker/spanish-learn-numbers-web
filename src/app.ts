// Application shell: state, settings persistence, navigation, and audio.
// This replaces the Obsidian plugin class. Settings live in localStorage;
// there is no SRS card state or session history in the web version.

import {
  AppSettings,
  CramRecentConfig,
  DEFAULT_SETTINGS,
  ListenLearnRecentConfig,
  ListenLearnState,
  PanelId,
} from './types';
import { CramSessionState } from './utils/learning';
import { validateCustomRanges as validateCustomRangesInput } from './utils/ranges';
import { RESOLVED_SPEECH, SpeechHandle, speak, stopSpeaking, warmUpVoices } from './utils/audio';
import { HomePanel } from './panels/home';
import { CramPanel } from './panels/cram';
import { ListenLearnPanel } from './panels/listen-learn';
import { NumberToSpanishPanel } from './panels/number-to-spanish';

const STORAGE_KEY = 'spanish-learn-numbers';

function parseHash(hash: string): PanelId {
  const value = hash.replace(/^#\/?/, '');
  if (value === 'cram' || value === 'listen-learn' || value === 'number-to-spanish') {
    return value;
  }
  return 'home';
}

export class App {
  settings: AppSettings;
  currentPanel: PanelId = 'home';
  cramSession: CramSessionState | null = null;
  cramSetupIsShuffled = false;
  listenLearnState: ListenLearnState;
  listenLearnCleanup: (() => void) | null = null;
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.settings = this.loadSettings();

    const saved = this.settings.listenLearnSettings;
    this.listenLearnState = {
      numbers: [],
      currentIndex: 0,
      showingAnswer: false,
      inputText: saved.inputText,
      direction: saved.direction,
      shuffled: saved.shuffled,
      autoRepeatRange: saved.autoRepeatRange,
    };

    warmUpVoices();

    window.addEventListener('hashchange', () => {
      this.currentPanel = parseHash(location.hash);
      this.render();
    });

    this.currentPanel = parseHash(location.hash);
    this.render();
  }

  private loadSettings(): AppSettings {
    const defaults: AppSettings = {
      ...DEFAULT_SETTINGS,
      cramRecentConfigs: [...DEFAULT_SETTINGS.cramRecentConfigs],
      listenLearnSettings: {
        ...DEFAULT_SETTINGS.listenLearnSettings,
        recentConfigs: [...DEFAULT_SETTINGS.listenLearnSettings.recentConfigs],
      },
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const data = JSON.parse(raw);
      const settings: AppSettings = {
        ...defaults,
        ...data,
        listenLearnSettings: { ...defaults.listenLearnSettings, ...data.listenLearnSettings },
      };
      // Settings saved before Google Translate TTS support was removed may
      // reference its voice ids; map them to the automatic device voice.
      if (settings.voiceId === 'es' || settings.voiceId === 'es-MX') {
        settings.voiceId = 'auto';
      }
      return settings;
    } catch {
      return defaults;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Private browsing or storage quota issues: the app still works,
      // preferences just won't persist.
    }
  }

  navigate(panel: PanelId) {
    const hash = panel === 'home' ? '' : `#${panel}`;
    if (parseHash(location.hash) === panel) {
      this.currentPanel = panel;
      this.render();
    } else if (panel === 'home') {
      // Avoid leaving a dangling '#' in the URL.
      history.pushState(null, '', location.pathname + location.search);
      this.currentPanel = 'home';
      this.render();
    } else {
      location.hash = hash;
    }
  }

  render() {
    if (this.listenLearnCleanup && this.currentPanel !== 'listen-learn') {
      this.listenLearnCleanup();
      this.listenLearnCleanup = null;
    }
    this.stopAudio();

    this.root.innerHTML = '';

    switch (this.currentPanel) {
      case 'cram':
        new CramPanel(this, this.root).render();
        break;
      case 'listen-learn':
        new ListenLearnPanel(this, this.root).render();
        break;
      case 'number-to-spanish':
        new NumberToSpanishPanel(this, this.root).render();
        break;
      default:
        new HomePanel(this, this.root).render();
    }
  }

  validateCustomRanges(input: string): { valid: boolean; error?: string; numbers?: number[] } {
    return validateCustomRangesInput(input);
  }

  shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Speak text aloud. Respects the audio toggle unless forcePlay is set. */
  playAudio(text: string, voiceId?: string, forcePlay: boolean = false): SpeechHandle {
    if (!this.settings.audioEnabled && !forcePlay) {
      return RESOLVED_SPEECH;
    }
    return speak(text, voiceId || this.settings.voiceId);
  }

  stopAudio() {
    stopSpeaking();
  }

  rememberListenLearnConfig(inputText: string, direction: ListenLearnRecentConfig['direction'], shuffled: boolean) {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      return;
    }

    const nextConfig: ListenLearnRecentConfig = {
      inputText: trimmedInput,
      direction,
      shuffled,
      usedAt: new Date().toISOString()
    };

    const dedupedConfigs = this.settings.listenLearnSettings.recentConfigs.filter((config) => {
      return !(config.inputText === trimmedInput && config.direction === direction && config.shuffled === shuffled);
    });

    this.settings.listenLearnSettings.recentConfigs = [nextConfig, ...dedupedConfigs].slice(0, 8);
  }

  rememberCramConfig(inputText: string, shuffled: boolean) {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      return;
    }

    const nextConfig: CramRecentConfig = {
      inputText: trimmedInput,
      shuffled,
      usedAt: new Date().toISOString()
    };

    const dedupedConfigs = this.settings.cramRecentConfigs.filter((config) => {
      return !(config.inputText === trimmedInput && config.shuffled === shuffled);
    });

    this.settings.cramRecentConfigs = [nextConfig, ...dedupedConfigs].slice(0, 8);
  }
}
