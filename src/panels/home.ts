// Home Panel - Main entry point

import { App } from '../app';
import { VOICE_OPTIONS } from '../types';
import { APP_ICONS, iconWithLabel } from '../ui/icons';

export class HomePanel {
  private app: App;
  private container: HTMLElement;

  constructor(app: App, container: HTMLElement) {
    this.app = app;
    this.container = container;
  }

  private getAudioToggleMarkup() {
    const audioIcon = this.app.settings.audioEnabled ? APP_ICONS.audio : APP_ICONS.audioOff;
    const audioLabel = this.app.settings.audioEnabled ? 'Audio on' : 'Audio off';
    const audioIconClass = this.app.settings.audioEnabled ? 'lsn-icon-only' : 'lsn-icon-only lsn-audio-icon-off';
    return `
      <button id="audio-toggle" class="lsn-btn-toggle lsn-dashboard-icon-btn" aria-label="${audioLabel}" title="${audioLabel}">
        <span id="audio-toggle-icon" class="${audioIconClass}">${audioIcon}</span>
      </button>
    `;
  }

  private updateAudioToggleButton() {
    const btn = this.container.querySelector('#audio-toggle') as HTMLButtonElement | null;
    const icon = this.container.querySelector('#audio-toggle-icon') as HTMLElement | null;
    const audioLabel = this.app.settings.audioEnabled ? 'Audio on' : 'Audio off';
    const audioIcon = this.app.settings.audioEnabled ? APP_ICONS.audio : APP_ICONS.audioOff;

    if (icon) {
      icon.innerHTML = audioIcon;
      icon.classList.toggle('lsn-audio-icon-off', !this.app.settings.audioEnabled);
    }

    if (btn) {
      btn.setAttribute('aria-label', audioLabel);
      btn.setAttribute('title', audioLabel);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="lsn-wrap">
        <div class="lsn-text-center lsn-mb-24">
          <h1 class="lsn-title-lg">Learn Spanish Numbers</h1>
          <p class="lsn-subtitle">Flashcards and listening practice from 0 to 1 trillion.</p>
        </div>

        <div class="lsn-home-actions lsn-mb-12">
          <button id="btn-cram" class="lsn-btn-secondary lsn-dashboard-btn">${iconWithLabel(APP_ICONS.cram, 'Flashcards')}</button>
          <button id="btn-listen" class="lsn-btn-purple lsn-dashboard-btn">${iconWithLabel(APP_ICONS.listen, 'Listen & Learn')}</button>
          <button id="btn-number-to-spanish" class="lsn-btn-dark lsn-dashboard-btn">${iconWithLabel(APP_ICONS.numberToSpanish, 'Number to Spanish')}</button>
        </div>

        <div class="lsn-dashboard-toolbar lsn-mt-16">
          <label class="lsn-text-muted-sm" for="voice-select">Voice</label>
          <select id="voice-select" class="lsn-input lsn-voice-select" aria-label="Spanish voice">
            ${VOICE_OPTIONS.map((voice) => `
              <option value="${voice.id}" ${voice.id === this.app.settings.voiceId ? 'selected' : ''}>${voice.name}</option>
            `).join('')}
          </select>
          ${this.getAudioToggleMarkup()}
        </div>
      </div>
    `;

    this.container.querySelector('#btn-cram')?.addEventListener('click', () => {
      this.app.navigate('cram');
    });

    this.container.querySelector('#btn-listen')?.addEventListener('click', () => {
      // Reset Listen & Learn state to show setup
      this.app.listenLearnState.numbers = [];
      this.app.listenLearnState.currentIndex = 0;
      this.app.listenLearnState.showingAnswer = false;
      this.app.navigate('listen-learn');
    });

    this.container.querySelector('#btn-number-to-spanish')?.addEventListener('click', () => {
      this.app.navigate('number-to-spanish');
    });

    this.container.querySelector('#voice-select')?.addEventListener('change', (e) => {
      this.app.settings.voiceId = (e.target as HTMLSelectElement).value;
      this.app.saveSettings();
    });

    this.container.querySelector('#audio-toggle')?.addEventListener('click', () => {
      this.app.settings.audioEnabled = !this.app.settings.audioEnabled;
      this.app.saveSettings();
      this.updateAudioToggleButton();
    });
  }
}
