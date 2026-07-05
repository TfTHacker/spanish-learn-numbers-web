// Audio playback for spoken numbers, using the browser's built-in speech
// synthesis (Web Speech API). Voices come from the user's platform: Google
// voices in Chrome, Microsoft neural voices in Edge, Apple voices on
// macOS/iOS, Android's Google TTS voices. All of them work offline.
//
// Voice ids:
// - 'auto'                → best available Spanish voice
// - 'browser:<voiceURI>'  → a specific voice picked by the user
// - a BCP-47-ish code ('es', 'es-MX', 'en') → best voice for that language

export interface SpeechHandle {
  done: Promise<void>;
  cancel: () => void;
}

export const BROWSER_VOICE_PREFIX = 'browser:';

const SYNTH_LANGS: Record<string, string> = {
  auto: 'es-ES',
  es: 'es-ES',
  'es-MX': 'es-MX',
  en: 'en-US',
};

const PLAYBACK_TIMEOUT_MS = 15000;

let activeCancel: (() => void) | null = null;

export const RESOLVED_SPEECH: SpeechHandle = { done: Promise.resolve(), cancel: () => {} };

export function isBrowserVoiceId(voiceId: string): boolean {
  return voiceId.startsWith(BROWSER_VOICE_PREFIX);
}

export function browserVoiceId(voice: SpeechSynthesisVoice): string {
  return `${BROWSER_VOICE_PREFIX}${voice.voiceURI}`;
}

function synthAvailable(): boolean {
  return 'speechSynthesis' in window;
}

function allSynthVoices(): SpeechSynthesisVoice[] {
  return synthAvailable() ? window.speechSynthesis.getVoices() : [];
}

/** Spanish voices installed in this browser/device, Spanish-Spanish first. */
export function getBrowserSpanishVoices(): SpeechSynthesisVoice[] {
  return allSynthVoices()
    .filter(voice => voice.lang.replace('_', '-').toLowerCase().startsWith('es'))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
}

function findBrowserVoice(voiceId: string): SpeechSynthesisVoice | null {
  const uri = voiceId.slice(BROWSER_VOICE_PREFIX.length);
  const voices = allSynthVoices();
  return voices.find(voice => voice.voiceURI === uri)
    ?? voices.find(voice => voice.name === uri)
    ?? null;
}

function pickSynthVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = allSynthVoices();
  const normalized = lang.toLowerCase();
  const exact = voices.find(v => v.lang.replace('_', '-').toLowerCase() === normalized);
  if (exact) return exact;
  const prefix = normalized.slice(0, 2);
  return voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export function speak(text: string, voiceId: string): SpeechHandle {
  stopSpeaking();

  if (!synthAvailable()) {
    return RESOLVED_SPEECH;
  }

  let voice: SpeechSynthesisVoice | null;
  let lang: string;

  if (isBrowserVoiceId(voiceId)) {
    voice = findBrowserVoice(voiceId);
    lang = voice?.lang ?? 'es-ES';
  } else {
    lang = SYNTH_LANGS[voiceId] ?? voiceId;
    voice = pickSynthVoice(lang);
  }

  let settled = false;
  let timeoutId: number | null = null;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => { resolveDone = resolve; });

  const finish = () => {
    if (settled) return;
    settled = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (activeCancel === cancel) activeCancel = null;
    resolveDone();
  };

  const cancel = () => {
    if (settled) return;
    window.speechSynthesis.cancel();
    finish();
  };

  activeCancel = cancel;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  if (voice) utterance.voice = voice;
  utterance.onend = finish;
  utterance.onerror = finish;
  timeoutId = window.setTimeout(finish, PLAYBACK_TIMEOUT_MS);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return { done, cancel };
}

export function stopSpeaking() {
  if (activeCancel) activeCancel();
  if (synthAvailable()) window.speechSynthesis.cancel();
}

// Some browsers load the synthesis voice list asynchronously; touching it
// early makes voices available by the time the user starts a session.
// Callers can subscribe to hear when the list arrives (e.g. to refresh a
// voice picker).
const voicesChangedCallbacks: Array<() => void> = [];

export function onVoicesChanged(callback: () => void) {
  voicesChangedCallbacks.push(callback);
}

export function warmUpVoices() {
  if (synthAvailable()) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
      voicesChangedCallbacks.forEach((callback) => callback());
    };
  }
}
