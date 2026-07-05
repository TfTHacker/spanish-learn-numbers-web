// Compact playback-speed toggle, embedded directly on pages that play audio
// so the rate can be adjusted in context rather than in a separate settings
// screen. Persists to app settings immediately; each speak() call reads the
// current rate, so there's nothing to re-render mid-playback.

import { App } from '../app';
import { SPEECH_RATE_OPTIONS } from '../types';

export function speedControlMarkup(currentRate: number): string {
  return `
    <div class="lsn-segmented-row">
      <span class="lsn-segmented-label">Speed</span>
      <div class="lsn-segmented" role="group" aria-label="Playback speed">
        ${SPEECH_RATE_OPTIONS.map((option) => `
          <button
            type="button"
            class="lsn-segmented-btn ${option.value === currentRate ? 'lsn-segmented-btn-active' : ''}"
            data-speed="${option.value}"
          >${option.label}</button>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindSpeedControl(container: HTMLElement, app: App) {
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-speed]'));
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.speed);
      if (!Number.isFinite(rate)) return;
      app.settings.speechRate = rate;
      app.saveSettings();
      buttons.forEach((b) => b.classList.toggle('lsn-segmented-btn-active', b === btn));
    });
  });
}
