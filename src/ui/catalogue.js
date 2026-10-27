import { bestsellers, newArrivals } from '../data/products.js';
import { formatPrice } from '../data/store.js';

const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
const bag = '<svg class="icon" aria-hidden="true"><use href="#i-bag"/></svg>';
const wa = '<svg class="icon" aria-hidden="true"><use href="#i-wa"/></svg>';
const plus = '<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>';

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function priceMarkup(product) {
  const old = product.oldPrice ? `<s>${formatPrice(product.oldPrice)}</s>` : '';
  return `<p class="product-price"><strong>${formatPrice(product.price)}</strong>${old}</p>`;
}

function badgeMarkup(product, extraClass = '') {
  if (!product.badge) return '';
  const sale = product.oldPrice ? ' is-sale' : '';
  return `<span class="product-badge${sale}${extraClass ? ` ${extraClass}` : ''}">${esc(product.badge)}</span>`;
}

function swatchesMarkup(product, color) {
  return product.colors
    .map(
      (item, index) => `
        <button
          class="mini-swatch"
          type="button"
          data-card-color="${esc(product.id)}"
          data-color-id="${esc(item.id)}"
          data-color-name="${esc(item.name)}"
          data-color-image="${esc(item.image)}"
          data-product-name="${esc(product.name)}"
          style="--swatch:${esc(item.hex)}"
          aria-label="اللون ${esc(item.name)}"
          aria-pressed="${item.id === color.id || (index === 0 && !color) ? 'true' : 'false'}"
        ></button>`,
    )
    .join('');
}

function cardMarkup(product) {
  const color = product.colors[0];
  return `
    <article class="product-card" data-product-card data-product-id="${esc(product.id)}">
      <div class="product-media">
        <img
          data-card-image
          src="${esc(color.image)}"
          alt="${esc(product.name)} — ${esc(color.name)}"
          width="900" height="900"
          loading="lazy" decoding="async"
        >
        ${badgeMarkup(product)}
        <button class="quick-view" type="button" data-quick-view="${esc(product.id)}">
          ${arrow}<span>اكتشف الزوج</span>
        </button>
      </div>
      <div class="product-body">
        <div class="product-topline">
          <span>${esc(product.category)}</span>
          <span class="product-color-name" data-card-color-name>${esc(color.name)}</span>
        </div>
        <h3 class="product-name">
          <button type="button" data-quick-view="${esc(product.id)}">${esc(product.name)}</button>
        </h3>
        ${priceMarkup(product)}
        <div class="product-foot">
          <div class="card-swatches" aria-label="ألوان ${esc(product.name)}">
            ${swatchesMarkup(product, color)}
          </div>
          <div class="card-actions">
            <button class="mini-action mini-action--add" type="button" data-card-add="${esc(product.id)}" aria-label="اختر المقاس وأضف ${esc(product.name)} إلى السلة">
              ${plus}
            </button>
            <button class="mini-action mini-action--wa" type="button" data-card-wa="${esc(product.id)}" aria-label="اطلب ${esc(product.name)} عبر واتساب">
              ${wa}
            </button>
          </div>
        </div>
      </div>
    </article>`;
}

function featureMarkup(product) {
  const color = product.colors[0];
  return `
    <article class="best-feature" data-product-card data-product-id="${esc(product.id)}">
      <div class="best-feature-media">
        <img
          data-card-image
          src="${esc(color.image)}"
          alt="${esc(product.name)} — ${esc(color.name)}"
          width="900" height="900"
          loading="lazy" decoding="async"
        >
        ${badgeMarkup(product, 'best-feature-badge')}
        <span class="best-rank" dir="ltr" aria-hidden="true">01</span>
      </div>
      <div class="best-feature-copy">
        <span class="product-badge best-inline-badge">الأكثر مبيعًا · 01</span>
        <h3><button type="button" data-quick-view="${esc(product.id)}">${esc(product.name)}</button></h3>
        <p class="best-summary">${esc(product.summary)}</p>
        ${priceMarkup(product)}
        <div class="best-feature-actions">
          <button class="btn btn-primary" type="button" data-card-add="${esc(product.id)}">
            <span>اختر المقاس</span>
            <span class="btn-icon">${arrow}</span>
          </button>
          <button class="icon-button" type="button" data-card-wa="${esc(product.id)}" aria-label="اطلب ${esc(product.name)} عبر واتساب">
            ${wa}
          </button>
        </div>
        <div class="card-swatches" aria-label="ألوان ${esc(product.name)}">
          ${swatchesMarkup(product, color)}
        </div>
      </div>
    </article>`;
}

function rowMarkup(product, index) {
  return `
    <article class="best-row" data-product-card data-product-id="${esc(product.id)}">
      <img
        data-card-image
        src="${esc(product.image)}"
        alt="${esc(product.name)}"
        width="118" height="118"
        loading="lazy" decoding="async"
      >
      <div class="best-row-copy">
        <span>الأكثر مبيعًا · ${String(index + 2).padStart(2, '0')}</span>
        <h3><button type="button" data-quick-view="${esc(product.id)}">${esc(product.name)}</button></h3>
        ${priceMarkup(product)}
      </div>
      <button class="best-row-add" type="button" data-card-add="${esc(product.id)}" aria-label="اختر مقاس ${esc(product.name)}">
        ${bag}
      </button>
    </article>`;
}

/** Render both catalogues. Run once, before binding delegated events. */
export function renderCatalogue() {
  const newGrid = document.querySelector('[data-grid="new"]');
  if (newGrid) {
    newGrid.insertAdjacentHTML('beforeend', newArrivals.map(cardMarkup).join(''));
  }

  const bestWrap = document.querySelector('[data-bestsellers]');
  if (bestWrap && bestsellers.length) {
    const [feature, ...rest] = bestsellers;
    bestWrap.insertAdjacentHTML(
      'beforeend',
      `${featureMarkup(feature)}<div class="best-list">${rest.map(rowMarkup).join('')}</div>`,
    );
  }
}

/**
 * Update a card when a mini swatch is pressed.
 * Returns true when the click belonged to a swatch.
 */
export function applyCardColor(button) {
  const card = button.closest('[data-product-card]');
  if (!card) return false;

  const image = card.querySelector('[data-card-image]');
  const name = button.dataset.colorName;
  const path = button.dataset.colorImage;
  if (image) {
    image.src = path;
    image.alt = `${button.dataset.productName} — ${name}`;
  }

  const label = card.querySelector('[data-card-color-name]');
  if (label) label.textContent = name;

  card.querySelectorAll('[data-card-color]').forEach((swatch) => {
    swatch.setAttribute('aria-pressed', swatch === button ? 'true' : 'false');
  });
  return true;
}
