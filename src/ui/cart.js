import { formatPrice, offerDiscount, store } from '../data/store.js';
import { bagInquiry, messageUrl } from './whatsapp.js';

const STORAGE_KEY = 'khotwa.bag.v1';
const MAX_QUANTITY = 9;

const listeners = new Set();
let items = read();

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productId === 'string' &&
          typeof item.size === 'string' &&
          typeof item.price === 'number' &&
          Number.isFinite(item.price),
      )
      .map((item) => ({
        key: String(item.key || `${item.productId}::${item.colorId}::${item.size}`),
        productId: item.productId,
        name: String(item.name || ''),
        colorId: String(item.colorId || ''),
        colorName: String(item.colorName || ''),
        size: item.size,
        price: item.price,
        image: String(item.image || ''),
        quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1)),
      }));
  } catch {
    return [];
  }
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* Storage can be unavailable in private mode; the bag still works in memory. */
  }
  listeners.forEach((listener) => listener(items));
}

function emit() {
  renderBag();
  save();
}

export function getItems() {
  return items.map((item) => ({ ...item }));
}

export function getTotals() {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = offerDiscount(subtotal, quantity);
  return { subtotal, quantity, discount, total: subtotal - discount };
}

export function getCount() {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToBag(product, color, size, quantity = 1) {
  const key = `${product.id}::${color.id}::${size}`;
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
  } else {
    items.push({
      key,
      productId: product.id,
      name: product.name,
      colorId: color.id,
      colorName: color.name,
      size,
      price: product.price,
      image: color.image,
      quantity: Math.min(MAX_QUANTITY, quantity),
    });
  }
  emit();
  return getCount();
}

export function setQuantity(key, delta) {
  const item = items.find((entry) => entry.key === key);
  if (!item) return;
  const next = item.quantity + delta;
  if (next <= 0) {
    items = items.filter((entry) => entry.key !== key);
  } else {
    item.quantity = Math.min(MAX_QUANTITY, next);
  }
  emit();
}

export function removeFromBag(key) {
  items = items.filter((entry) => entry.key !== key);
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function checkoutHref() {
  if (!items.length) return '#';
  const totals = getTotals();
  return messageUrl(bagInquiry(items, totals));
}

/** Paint the drawer, header count and WhatsApp checkout link. */
export function renderBag() {
  const count = getCount();
  document.querySelectorAll('[data-cart-count]').forEach((node) => {
    node.textContent = String(count);
  });
  document.querySelectorAll('[data-cart-title-count]').forEach((node) => {
    node.textContent = `(${count})`;
  });

  const body = document.querySelector('[data-cart-items]');
  const empty = document.querySelector('[data-cart-empty]');
  const foot = document.querySelector('[data-cart-foot]');
  if (!body || !empty || !foot) return;

  if (!items.length) {
    body.innerHTML = '';
    body.hidden = true;
    empty.hidden = false;
    foot.hidden = true;
    return;
  }

  body.hidden = false;
  empty.hidden = true;
  foot.hidden = false;

  body.innerHTML = items
    .map(
      (item) => `
      <article class="cart-item" data-cart-key="${esc(item.key)}">
        <img src="${esc(item.image)}" alt="${esc(item.name)} — ${esc(item.colorName)}" width="76" height="76" loading="lazy">
        <div>
          <div class="cart-item-top">
            <div>
              <h3>${esc(item.name)}</h3>
              <p class="cart-item-meta">مقاس ${esc(item.size)} · ${esc(item.colorName)}</p>
              <p class="cart-item-price">${formatPrice(item.price)}</p>
            </div>
            <button class="cart-remove" type="button" data-cart-remove aria-label="إزالة ${esc(item.name)} من السلة">
              <svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg>
            </button>
          </div>
          <div class="cart-item-bottom">
            <div class="qty-control">
              <button type="button" data-qty="-1" aria-label="تقليل كمية ${esc(item.name)}">−</button>
              <span aria-live="polite">${item.quantity}</span>
              <button type="button" data-qty="1" aria-label="زيادة كمية ${esc(item.name)}">+</button>
            </div>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
        </div>
      </article>`,
    )
    .join('');

  const totals = getTotals();
  document.querySelector('[data-cart-subtotal]').textContent = formatPrice(totals.subtotal);
  document.querySelector('[data-cart-total]').textContent = formatPrice(totals.total);

  const discountRow = document.querySelector('[data-cart-discount-row]');
  if (discountRow) {
    discountRow.hidden = totals.discount <= 0;
    if (totals.discount > 0) {
      document.querySelector('[data-cart-discount]').textContent = `−${formatPrice(totals.discount)}`;
      document.querySelector('[data-cart-discount-label]').textContent = `خصم ${store.offer.percent}% (زوجان أو أكثر)`;
    }
  }

  const checkout = document.querySelector('[data-cart-checkout]');
  if (checkout) checkout.href = checkoutHref();
}

function nearestKey(target) {
  return target.closest('[data-cart-key]')?.dataset.cartKey || '';
}

/** Bind quantity/remove controls once. */
export function initCart() {
  const body = document.querySelector('[data-cart-items]');
  body?.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      removeFromBag(nearestKey(remove));
      return;
    }
    const qty = event.target.closest('[data-qty]');
    if (qty) {
      setQuantity(nearestKey(qty), Number(qty.dataset.qty));
    }
  });

  // Keep multiple tabs roughly in sync.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    items = read();
    renderBag();
  });

  renderBag();
}
