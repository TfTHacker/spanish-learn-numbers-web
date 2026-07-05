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
import { SettingsPanel } from './panels/settings';

const STORAGE_KEY = 'spanish-learn-numbers';
const KNOWN_PANELS: PanelId[] = ['cram', 'listen-learn', 'number-to-spanish', 'settings'];

function parseHash(hash: string): { panel: PanelId; params: URLSearchParams } {
  const raw = hash.replace(/^#\/?/, '');
  const [panelPart, queryPart] = raw.split('?');
  const panel = (KNOWN_PANELS as string[]).includes(panelPart) ? (panelPart as PanelId) : 'home';
  return { panel, params: new URLSearchParams(queryPart ?? '') };
}

export class App {
  settings: AppSettings;
  currentPanel: PanelId = 'home';
  cramSession: CramSessionState | null = null;
  cramSetupIsShuffled = false;
  listenLearnState: ListenLearnState;
  listenLearnCleanup: (() => void) | null = null;
  private pendingShareParams: URLSearchParams | null = null;
  private activeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
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
      const { panel, params } = parseHash(location.hash);
      this.currentPanel = panel;
      this.pendingShareParams = params.toString() ? params : null;
      this.render();
    });

    const initial = parseHash(location.hash);
    this.currentPanel = initial.panel;
    this.pendingShareParams = initial.params.toString() ? initial.params : null;
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
    if (parseHash(location.hash).panel === panel) {
      this.currentPanel = panel;
      this.pendingShareParams = null;
      this.render();
    } else if (panel === 'home') {
      // Avoid leaving a dangling '#' in the URL.
      history.pushState(null, '', location.pathname + location.search);
      this.currentPanel = 'home';
      this.pendingShareParams = null;
      this.render();
    } else {
      location.hash = hash;
    }
  }

  /**
   * Returns the query params from a shared drill link (e.g. #cram?ranges=1-20&shuffle=1)
   * exactly once — subsequent internal re-renders (Back, Start Over) get null.
   */
  consumeShareParams(): URLSearchParams | null {
    const params = this.pendingShareParams;
    this.pendingShareParams = null;
    return params;
  }

  buildShareUrl(panel: PanelId, params: Record<string, string>): string {
    const query = new URLSearchParams(params).toString();
    return `${location.origin}${location.pathname}#${panel}?${query}`;
  }

  /** Registers the sole active keydown handler, replacing whatever page owned it before. */
  setKeyHandler(handler: ((e: KeyboardEvent) => void) | null) {
    if (this.activeKeyHandler) {
      window.removeEventListener('keydown', this.activeKeyHandler);
    }
    this.activeKeyHandler = handler;
    if (handler) {
      window.addEventListener('keydown', handler);
    }
  }

  render() {
    if (this.listenLearnCleanup && this.currentPanel !== 'listen-learn') {
      this.listenLearnCleanup();
      this.listenLearnCleanup = null;
    }
    this.setKeyHandler(null);
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
      case 'settings':
        new SettingsPanel(this, this.root).render();
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
    return speak(text, voiceId || this.settings.voiceId, this.settings.speechRate);
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
