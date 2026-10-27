import { getProduct } from '../data/products.js';
import { formatPrice } from '../data/store.js';
import { closeDialog, openDialog } from './dialogs.js';
import { addToBag } from './cart.js';
import { openWhatsApp, productInquiry } from './whatsapp.js';
import { showToast } from './toast.js';

const dialog = document.querySelector('[data-product-dialog]');
const image = dialog?.querySelector('[data-modal-image]');
const colorName = dialog?.querySelector('[data-modal-color-name]');
const colorsHost = dialog?.querySelector('[data-modal-colors]');
const sizesHost = dialog?.querySelector('[data-modal-sizes]');
const error = dialog?.querySelector('[data-modal-error]');

let current = null;
let selectedColor = null;
let selectedSize = null;

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function paintColor(color) {
  if (!current || !color) return;
  selectedColor = color;
  if (image) {
    image.src = color.image;
    image.alt = `${current.name} — ${color.name}`;
  }
  if (colorName) colorName.textContent = color.name;
}

function paintSizes() {
  if (!current || !sizesHost) return;
  sizesHost.innerHTML = current.sizes
    .map(
      (size) => `
      <label class="size-choice">
        <input type="radio" name="modal-size" value="${esc(size)}">
        <span>${esc(size)}</span>
      </label>`,
    )
    .join('');
}

function paintColors() {
  if (!current || !colorsHost) return;
  colorsHost.innerHTML = current.colors
    .map(
      (color, index) => `
      <label class="color-choice">
        <input
          type="radio"
          name="modal-color"
          value="${esc(color.id)}"
          data-image="${esc(color.image)}"
          data-name="${esc(color.name)}"
          ${index === 0 ? 'checked' : ''}
        >
        <span style="--swatch:${esc(color.hex)}" title="${esc(color.name)}"></span>
      </label>`,
    )
    .join('');
}

function fill(product) {
  const first = product.colors[0];

  dialog.querySelector('[data-modal-category]').textContent = product.category;
  dialog.querySelector('[data-modal-name]').textContent = product.name;
  dialog.querySelector('[data-modal-summary]').textContent = product.summary;
  dialog.querySelector('[data-modal-price]').textContent = formatPrice(product.price);

  const oldPrice = dialog.querySelector('[data-modal-old-price]');
  if (oldPrice) {
    oldPrice.hidden = !product.oldPrice;
    oldPrice.textContent = product.oldPrice ? formatPrice(product.oldPrice) : '';
  }

  const badge = dialog.querySelector('[data-modal-badge]');
  if (badge) {
    badge.textContent = product.badge || '';
    badge.hidden = !product.badge;
  }

  const details = dialog.querySelector('[data-modal-details]');
  if (details) {
    details.innerHTML = (product.details || []).map((line) => `<li>${esc(line)}</li>`).join('');
  }

  paintColors();
  paintSizes();
  paintColor(first);

  if (error) error.hidden = true;
  dialog.querySelector('.product-modal').scrollTop = 0;
  dialog.scrollTop = 0;
}

export function openProduct(id) {
  if (!dialog) return;
  const product = getProduct(id);
  if (!product) return;
  current = product;
  selectedSize = null;
  fill(product);
  openDialog(dialog);
}

export function closeProduct() {
  closeDialog(dialog);
}

function requireSize() {
  if (selectedSize) return true;
  if (error) error.hidden = false;
  sizesHost?.querySelector('input')?.focus();
  return false;
}

export function initProductDialog() {
  if (!dialog) return;

  dialog.querySelector('[data-product-close]')?.addEventListener('click', closeProduct);

  colorsHost?.addEventListener('change', (event) => {
    const input = event.target.closest('input[name="modal-color"]');
    if (!input) return;
    paintColor({
      id: input.value,
      name: input.dataset.name,
      image: input.dataset.image,
    });
  });

  sizesHost?.addEventListener('change', (event) => {
    const input = event.target.closest('input[name="modal-size"]');
    if (!input) return;
    selectedSize = input.value;
    if (error) error.hidden = true;
  });

  dialog.querySelector('[data-modal-add]')?.addEventListener('click', () => {
    if (!current || !selectedColor || !requireSize()) return;
    addToBag(current, selectedColor, selectedSize);
    showToast('أُضيف الزوج إلى السلة.');
    closeProduct();
  });

  dialog.querySelector('[data-modal-wa]')?.addEventListener('click', () => {
    if (!current || !selectedColor || !requireSize()) return;
    openWhatsApp(productInquiry(current, selectedColor, selectedSize));
  });
}
