const el = document.querySelector('[data-toast]');
const textEl = document.querySelector('[data-toast-text]');
let timer = 0;

export function hideToast() {
  if (!el) return;
  el.classList.remove('is-visible');
  window.clearTimeout(timer);
}

export function showToast(message) {
  if (!el || !textEl) return;
  textEl.textContent = message;
  el.classList.add('is-visible');
  window.clearTimeout(timer);
  timer = window.setTimeout(hideToast, 3800);
}

export function initToast(onViewBag) {
  if (!el) return;
  el.querySelector('[data-toast-cart]')?.addEventListener('click', () => {
    hideToast();
    onViewBag?.();
  });
}
