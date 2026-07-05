// Number to Spanish Panel - Convert numbers to Spanish, cardinal or ordinal

import { App } from '../app';
import { APP_ICONS, iconOnly } from '../ui/icons';
import { toast } from '../ui/toast';
import { bindSpeedControl, speedControlMarkup } from '../ui/speed-control';
import { getSpanishNumberBreakdown, MAX_ORDINAL, numberToSpanish, numberToSpanishOrdinal } from '../utils/numbers';

type NumberType = 'cardinal' | 'ordinal';

export class NumberToSpanishPanel {
  private app: App;
  private container: HTMLElement;
  private currentSpanishText: string = '';
  private numberType: NumberType = 'cardinal';

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

    // Ordinals aren't built from the same scale-by-scale decomposition as
    // cardinals (e.g. "vigésimo primero" isn't "veinte" + "uno"), so the
    // breakdown only makes sense for cardinal numbers.
    if (this.numberType === 'ordinal') {
      breakdownEl.innerHTML = '';
      breakdownEl.classList.add('lsn-number-breakdown-pending');
      return;
    }

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

  private validationMessage(): string {
    return this.numberType === 'ordinal'
      ? `Enter a valid number (1-${MAX_ORDINAL})`
      : 'Enter a valid number (0-1 trillion)';
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

    if (this.numberType === 'ordinal') {
      if (num < BigInt(1) || num > BigInt(MAX_ORDINAL)) {
        this.clearSpanishResult();
        return false;
      }
      const ordinal = numberToSpanishOrdinal(Number(num));
      if (!ordinal) {
        this.clearSpanishResult();
        return false;
      }
      this.setSpanishResult(ordinal);
      this.renderBreakdown(Number(num));
      return true;
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
          <div class="lsn-segmented-row" style="margin-top:0;">
            <div class="lsn-segmented" role="group" aria-label="Number type">
              <button type="button" id="type-cardinal" class="lsn-segmented-btn lsn-segmented-btn-active" data-type="cardinal">Cardinal</button>
              <button type="button" id="type-ordinal" class="lsn-segmented-btn" data-type="ordinal">Ordinal</button>
            </div>
          </div>
          <div class="lsn-mb-12">
            <label class="lsn-label">Number:</label>
            <input id="num-input" type="text" inputmode="numeric" placeholder="Enter a number (0-1 trillion)" class="lsn-input lsn-input-lg">
          </div>
          <div class="lsn-number-to-spanish-stage">
            <div id="number-to-spanish-result" class="lsn-number-to-spanish-result lsn-number-to-spanish-result-pending">
              <div id="number-to-spanish-text" class="lsn-number-to-spanish-text"></div>
            </div>
            <div class="lsn-number-to-spanish-controls">
              <button id="btn-speak-spanish" class="lsn-btn-purple lsn-number-to-spanish-speak" disabled aria-label="Play audio">${iconOnly(APP_ICONS.audio)}</button>
            </div>
          </div>
          ${speedControlMarkup(this.app.settings.speechRate)}
          <div id="number-breakdown" class="lsn-number-breakdown lsn-number-breakdown-pending"></div>
        </div>
        <div class="lsn-footer-actions">
          <div class="lsn-footer-actions-left"></div>
          <button id="btn-home" class="lsn-home-btn-text" aria-label="Home">${iconOnly(APP_ICONS.home)}</button>
        </div>
      </div>
    `;

    const inputEl = this.container.querySelector('#num-input') as HTMLInputElement;
    const cardinalBtn = this.container.querySelector('#type-cardinal') as HTMLButtonElement;
    const ordinalBtn = this.container.querySelector('#type-ordinal') as HTMLButtonElement;

    bindSpeedControl(this.container, this.app);

    this.container.querySelector('#btn-home')?.addEventListener('click', () => {
      this.app.navigate('home');
    });

    const setType = (type: NumberType) => {
      this.numberType = type;
      cardinalBtn.classList.toggle('lsn-segmented-btn-active', type === 'cardinal');
      ordinalBtn.classList.toggle('lsn-segmented-btn-active', type === 'ordinal');
      inputEl.placeholder = type === 'ordinal' ? `Enter a number (1-${MAX_ORDINAL})` : 'Enter a number (0-1 trillion)';
      this.convertNumberToSpanish(inputEl.value.trim());
    };

    cardinalBtn.addEventListener('click', () => setType('cardinal'));
    ordinalBtn.addEventListener('click', () => setType('ordinal'));

    const playCurrentSpanish = () => {
      if (!this.currentSpanishText) {
        toast(this.validationMessage());
        return;
      }
      this.app.playAudio(this.currentSpanishText, undefined, true);
    };

    const handlePlaySpanish = () => {
      const numStr = inputEl.value.trim();
      if (!this.convertNumberToSpanish(numStr)) {
        toast(this.validationMessage());
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
