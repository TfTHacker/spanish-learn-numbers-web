// Lightweight replacement for Obsidian's Notice.

let container: HTMLElement | null = null;

export function toast(message: string) {
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'lsn-toast-container';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = 'lsn-toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  container.appendChild(el);

  window.setTimeout(() => {
    el.classList.add('lsn-toast-out');
    window.setTimeout(() => el.remove(), 300);
  }, 2600);
}
