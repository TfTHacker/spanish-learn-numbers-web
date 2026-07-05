// Home Panel - Main entry point

import { App } from '../app';
import { APP_ICONS, iconWithLabel } from '../ui/icons';
import { browserVoiceId, getBrowserSpanishVoices, isBrowserVoiceId, onVoicesChanged } from '../utils/audio';
import { escapeHtml } from '../utils/html';

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

  private voiceOptionsMarkup(): string {
    const selected = this.app.settings.voiceId;
    const browserVoices = getBrowserSpanishVoices();
    const browserIds = new Set(browserVoices.map((voice) => browserVoiceId(voice)));

    const autoOption = `<option value="auto" ${selected === 'auto' ? 'selected' : ''}>Automatic — best Spanish voice on this device</option>`;

    const browserGroup = browserVoices.length > 0 ? `
      <optgroup label="This browser / device (offline)">
        ${browserVoices.map((voice) => {
          const id = browserVoiceId(voice);
          return `<option value="${escapeHtml(id)}" ${id === selected ? 'selected' : ''}>${escapeHtml(`${voice.name} — ${voice.lang}`)}</option>`;
        }).join('')}
      </optgroup>
    ` : '';

    // A previously chosen browser voice that isn't loaded (yet) still needs
    // an entry, otherwise the select silently jumps to the first option.
    const missingSelected = isBrowserVoiceId(selected) && !browserIds.has(selected)
      ? `<option value="${escapeHtml(selected)}" selected>Saved browser voice</option>`
      : '';

    return autoOption + browserGroup + missingSelected;
  }

  render() {
    this.container.innerHTML = `
      <div class="lsn-wrap">
        <div class="lsn-text-center lsn-mb-24">
          <h1 class="lsn-title-lg">Learn Spanish Numbers</h1>
        </div>

        <div class="lsn-home-actions lsn-mb-12">
          <button id="btn-cram" class="lsn-btn-secondary lsn-dashboard-btn">${iconWithLabel(APP_ICONS.cram, 'Flashcards')}</button>
          <button id="btn-listen" class="lsn-btn-purple lsn-dashboard-btn">${iconWithLabel(APP_ICONS.listen, 'Listen & Learn')}</button>
          <button id="btn-number-to-spanish" class="lsn-btn-dark lsn-dashboard-btn">${iconWithLabel(APP_ICONS.numberToSpanish, 'Number to Spanish')}</button>
        </div>

        <div class="lsn-dashboard-toolbar lsn-mt-16">
          <label class="lsn-text-muted-sm" for="voice-select">Voice</label>
          <select id="voice-select" class="lsn-input lsn-voice-select" aria-label="Spanish voice">
            ${this.voiceOptionsMarkup()}
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

    const voiceSelect = this.container.querySelector('#voice-select') as HTMLSelectElement | null;

    voiceSelect?.addEventListener('change', () => {
      this.app.settings.voiceId = voiceSelect.value;
      this.app.saveSettings();
      // Preview so the user hears the chosen voice immediately.
      this.app.playAudio('Hola, vamos a practicar los números.', undefined, true);
    });

    // Browser voice lists often load asynchronously; refresh the picker when
    // they arrive (stale callbacks from earlier renders no-op via isConnected).
    onVoicesChanged(() => {
      if (voiceSelect?.isConnected) {
        voiceSelect.innerHTML = this.voiceOptionsMarkup();
      }
    });

    this.container.querySelector('#audio-toggle')?.addEventListener('click', () => {
      this.app.settings.audioEnabled = !this.app.settings.audioEnabled;
      this.app.saveSettings();
      this.updateAudioToggleButton();
    });
  }
}
