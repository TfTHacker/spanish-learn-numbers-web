// Number to Spanish Panel - Convert numbers to Spanish

import { App } from '../app';
import { APP_ICONS, iconOnly } from '../ui/icons';
import { toast } from '../ui/toast';
import { getSpanishNumberBreakdown, numberToSpanish } from '../utils/numbers';

export class NumberToSpanishPanel {
  private app: App;
  private container: HTMLElement;
  private currentSpanishText: string = '';

  constructor(app: App, container: HTMLElement) {
    this.app = app;
    this.container = container;
  }

  private setSpanishResult(spanish: string) {
    const resultEl = this.container.querySelector('#number-to-spanish-result') as HTMLElement | null;
    const spanishEl = this.container.querySelector('#number-to-spanish-text') as HTMLElement | null;
    const speakBtn = this.container.querySelector('#btn-speak-spanish') as HTMLButtonElement | null;

    this.currentSpanishText = spanish;
    if (spanishEl) spanishEl.textContent = spanish;
    if (resultEl) {
      resultEl.classList.remove('lsn-number-to-spanish-result-pending');
    }
    if (speakBtn) speakBtn.disabled = false;
  }

  private clearSpanishResult() {
    const resultEl = this.container.querySelector('#number-to-spanish-result') as HTMLElement | null;
    const spanishEl = this.container.querySelector('#number-to-spanish-text') as HTMLElement | null;
    const speakBtn = this.container.querySelector('#btn-speak-spanish') as HTMLButtonElement | null;
    const breakdownEl = this.container.querySelector('#number-breakdown') as HTMLElement | null;

    this.currentSpanishText = '';
    if (spanishEl) spanishEl.textContent = '';
    if (resultEl) {
      resultEl.classList.add('lsn-number-to-spanish-result-pending');
    }
    if (breakdownEl) {
      breakdownEl.innerHTML = '';
      breakdownEl.classList.add('lsn-number-breakdown-pending');
    }
    if (speakBtn) speakBtn.disabled = true;
  }

  private renderBreakdown(num: number) {
    const breakdownEl = this.container.querySelector('#number-breakdown') as HTMLElement | null;
    if (!breakdownEl) return;

    const parts = getSpanishNumberBreakdown(num);
    breakdownEl.classList.remove('lsn-number-breakdown-pending');
    breakdownEl.innerHTML = `
      <div class="lsn-number-breakdown-title">Breakdown</div>
      <div class="lsn-number-breakdown-list">
        ${parts.map((part) => `
          <div class="lsn-number-breakdown-item">
            <div class="lsn-number-breakdown-meta">
              <span class="lsn-number-breakdown-label">${part.label}</span>
              <span class="lsn-number-breakdown-value">${part.value.toLocaleString()}</span>
            </div>
            <div class="lsn-number-breakdown-text">${part.spanish}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private convertNumberToSpanish(numStr: string): boolean {
    if (!numStr || !/^\d+$/.test(numStr)) {
      this.clearSpanishResult();
      return false;
    }

    let num: bigint;
    try {
      num = BigInt(numStr);
    } catch {
      this.clearSpanishResult();
      return false;
    }

    if (num < BigInt(0) || num > BigInt('1000000000000')) {
      this.clearSpanishResult();
      return false;
    }

    const spanish = numberToSpanish(Number(num));
    this.setSpanishResult(spanish);
    this.renderBreakdown(Number(num));

    return true;
  }

  render() {
    this.container.innerHTML = `
      <div class="lsn-wrap">
        <h2 class="lsn-title-lg lsn-mb-24">Number to Spanish</h2>
        <div class="lsn-card-sm" style="overflow-wrap:break-word;">
          <div class="lsn-mb-16">
            <label class="lsn-label">Number:</label>
            <input id="num-input" type="text" inputmode="numeric" placeholder="Enter a number (0-1 trillion)" class="lsn-input lsn-input-lg">
          </div>
          <div class="lsn-example">Spanish text updates as you type. Press Enter or tap the speaker to hear it.</div>
          <div class="lsn-number-to-spanish-stage">
            <div id="number-to-spanish-result" class="lsn-number-to-spanish-result lsn-number-to-spanish-result-pending">
              <div id="number-to-spanish-text" class="lsn-number-to-spanish-text"></div>
            </div>
            <div class="lsn-number-to-spanish-controls">
              <button id="btn-speak-spanish" class="lsn-btn-purple lsn-number-to-spanish-speak" disabled aria-label="Play audio">${iconOnly(APP_ICONS.audio)}</button>
            </div>
          </div>
          <div id="number-breakdown" class="lsn-number-breakdown lsn-number-breakdown-pending"></div>
        </div>
        <div class="lsn-footer-actions">
          <div class="lsn-footer-actions-left"></div>
          <button id="btn-home" class="lsn-home-btn-text" aria-label="Home">${iconOnly(APP_ICONS.home)}</button>
        </div>
      </div>
    `;

    const inputEl = this.container.querySelector('#num-input') as HTMLInputElement;

    this.container.querySelector('#btn-home')?.addEventListener('click', () => {
      this.app.navigate('home');
    });

    const playCurrentSpanish = () => {
      if (!this.currentSpanishText) {
        toast('Enter a valid number (0-1 trillion)');
        return;
      }
      this.app.playAudio(this.currentSpanishText, undefined, true);
    };

    const handlePlaySpanish = () => {
      const numStr = inputEl.value.trim();
      if (!this.convertNumberToSpanish(numStr)) {
        toast('Enter a valid number (0-1 trillion)');
        return;
      }
      playCurrentSpanish();
    };

    const handleInput = () => {
      inputEl.value = inputEl.value.replace(/[^0-9]/g, '');
      this.convertNumberToSpanish(inputEl.value.trim());
    };

    inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handlePlaySpanish();
      }
    });

    inputEl.addEventListener('input', handleInput);

    this.container.querySelector('#btn-speak-spanish')?.addEventListener('click', () => {
      playCurrentSpanish();
    });

    inputEl.focus();
  }
}
