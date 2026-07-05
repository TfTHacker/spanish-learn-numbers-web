// Audio playback for spoken numbers.
//
// Primary backend: Google Translate TTS via a shared <audio> element (same as
// the Obsidian plugin). Browsers may block that endpoint (referer checks,
// network policies), so on any playback error we fall back to the built-in
// Web Speech API, which works offline in every modern browser.

export interface SpeechHandle {
  done: Promise<void>;
  cancel: () => void;
}

const SYNTH_LANGS: Record<string, string> = {
  es: 'es-ES',
  'es-MX': 'es-MX',
  en: 'en-US',
};

const PLAYBACK_TIMEOUT_MS = 15000;

let sharedAudio: HTMLAudioElement | null = null;
let activeCancel: (() => void) | null = null;

export const RESOLVED_SPEECH: SpeechHandle = { done: Promise.resolve(), cancel: () => {} };

function pickSynthVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const normalized = lang.toLowerCase();
  const exact = voices.find(v => v.lang.replace('_', '-').toLowerCase() === normalized);
  if (exact) return exact;
  const prefix = normalized.slice(0, 2);
  return voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export function speak(text: string, voiceId: string): SpeechHandle {
  stopSpeaking();

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
    if (usingSynth && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    finish();
  };

  const fallbackToSynth = () => {
    if (settled) return;
    if (!('speechSynthesis' in window)) {
      finish();
      return;
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

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voiceId}&client=gtx`;
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

export function stopSpeaking() {
  if (activeCancel) activeCancel();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Some browsers load the synthesis voice list asynchronously; touching it
// early makes voices available by the time the user starts a session.
export function warmUpVoices() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}
