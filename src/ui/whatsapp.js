import { formatPrice, store, whatsappUrl } from '../data/store.js';

/** Build the chat text for a single product inquiry. */
export function productInquiry(product, color, size, quantity = 1) {
  const price = product.price * quantity;
  const lines = [
    'مرحبًا KHOTWA، أريد طلب هذا الزوج:',
    '',
    `• المنتج: ${product.name}`,
    `• المقاس: EU ${size}`,
    `• اللون: ${color.name}`,
    `• الكمية: ${quantity}`,
    `• السعر: ${formatPrice(price)}`,
    '',
    'أرجو تأكيد التوفر وطريقة التوصيل.',
  ];
  return lines.join('\n');
}

/** Build the chat text for the whole bag. */
export function bagInquiry(items, totals) {
  const lines = ['مرحبًا KHOTWA، أريد تأكيد هذا الطلب:', ''];
  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} — المقاس ${item.size} · ${item.colorName} · ${item.quantity} × ${formatPrice(item.price)}`,
    );
  });
  lines.push('', `المجموع: ${formatPrice(totals.subtotal)}`);
  if (totals.discount > 0) {
    lines.push(`الخصم (${store.offer.percent}%): −${formatPrice(totals.discount)}`);
  }
  lines.push(`الإجمالي: ${formatPrice(totals.total)}`, '', 'أرجو تأكيد التوصيل إلى ولايتي.');
  return lines.join('\n');
}

export function genericMessage() {
  return 'مرحبًا KHOTWA، لدي سؤال عن منتجاتكم.';
}

/** Open WhatsApp in a new tab with a pre-filled message. */
export function openWhatsApp(message = genericMessage()) {
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
}

export function messageUrl(message) {
  return whatsappUrl(message);
}
