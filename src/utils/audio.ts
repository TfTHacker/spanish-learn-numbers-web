// Audio playback for spoken numbers.
//
// Two backends:
// - Google Translate TTS via a shared <audio> element (same as the Obsidian
//   plugin). Browsers may block that endpoint (referer checks, network
//   policies), so on any playback error we fall back to the Web Speech API.
// - Browser/device voices via the Web Speech API, selected explicitly with a
//   "browser:<voiceURI>" voice id. These work offline and vary by platform
//   (Google voices in Chrome, Microsoft neural voices in Edge, Apple voices
//   on macOS/iOS, etc.).

import { toast } from '../ui/toast';

export interface SpeechHandle {
  done: Promise<void>;
  cancel: () => void;
}

export const BROWSER_VOICE_PREFIX = 'browser:';

const SYNTH_LANGS: Record<string, string> = {
  es: 'es-ES',
  'es-MX': 'es-MX',
  en: 'en-US',
};

const PLAYBACK_TIMEOUT_MS = 15000;

let sharedAudio: HTMLAudioElement | null = null;
let activeCancel: (() => void) | null = null;
let googleFallbackNotified = false;

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

  if (isBrowserVoiceId(voiceId)) {
    return speakWithSynth(text, findBrowserVoice(voiceId), 'es-ES');
  }

  let settled = false;
  let usingSynth = false;
  let timeoutId: number | null = null;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => { resolveDone = resolve; });

  const audio = sharedAudio ?? new Audio();
  sharedAudio = audio;

  const finish = () => {
    if (settled) return;
    settled = true;
    audio.removeEventListener('ended', finish);
    audio.removeEventListener('abort', finish);
    audio.removeEventListener('error', onAudioError);
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (activeCancel === cancel) activeCancel = null;
    resolveDone();
  };

  const cancel = () => {
    if (settled) return;
    audio.pause();
    if (usingSynth && synthAvailable()) window.speechSynthesis.cancel();
    finish();
  };

  const fallbackToSynth = () => {
    if (settled) return;
    if (!synthAvailable()) {
      finish();
      return;
    }
    if (!googleFallbackNotified) {
      googleFallbackNotified = true;
      toast('Google Translate voice unavailable — using a browser voice instead.');
    }
    usingSynth = true;
    const lang = SYNTH_LANGS[voiceId] ?? voiceId;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = pickSynthVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const onAudioError = () => fallbackToSynth();

  activeCancel = cancel;

  // client=tw-ob is the variant that works from regular web pages; the
  // client=gtx form the Obsidian plugin used is often rejected when the
  // request carries a browser Referer header.
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voiceId}&client=tw-ob`;
  audio.pause();
  audio.src = url;
  audio.load();
  audio.addEventListener('ended', finish);
  audio.addEventListener('abort', finish);
  audio.addEventListener('error', onAudioError);
  timeoutId = window.setTimeout(finish, PLAYBACK_TIMEOUT_MS);
  audio.play().catch(() => fallbackToSynth());

  return { done, cancel };
}

function speakWithSynth(text: string, voice: SpeechSynthesisVoice | null, fallbackLang: string): SpeechHandle {
  if (!synthAvailable()) {
    return RESOLVED_SPEECH;
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
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = fallbackLang;
    const picked = pickSynthVoice(fallbackLang);
    if (picked) utterance.voice = picked;
  }
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
