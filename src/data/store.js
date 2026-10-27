/**
 * KHOTWA storefront — single editable data file.
 * Change the WhatsApp number, shipping copy, offer, currency, 3D model and
 * the product catalogue here. Every UI module reads from this file.
 */
export const store = {
  brand: {
    latin: 'KHOTWA',
    arabic: 'خطوة',
    tagline: 'أحذية تُقاس بالتفاصيل',
  },
  // International format, digits only. This is the single source of truth.
  whatsapp: '21623025599',
  currency: 'TND',
  currencyLabel: 'د.ت',
  locale: 'ar-TN-u-nu-latn',
  announcement: 'توصيل إلى كل ولايات تونس · الدفع عند الاستلام',
  shipping: {
    note: 'نؤكد مدة التوصيل وطريقة الدفع عند استلام طلبك عبر واتساب.',
    returns: 'استبدال خلال 7 أيام للأزواج غير المستعملة وفي تغليفها الأصلي.',
  },
  offer: {
    active: true,
    titleTop: 'زوجان،',
    titleAccent: 'وخصم 10%.',
    short: 'خصم 10% على كل زوجين',
    description: 'أضف زوجين أو أكثر إلى السلة، ويُحسب الخصم تلقائيًا قبل إرسال الطلب عبر واتساب.',
    stampNote: 'ON TWO PAIRS',
    percent: 10,
    minimumQuantity: 2,
  },
  hours: 'من الاثنين إلى السبت · 9:00–18:00',
  // The hero GLB. Replace the file at this path, or point this elsewhere.
  // Rotation/camera values are safe defaults for the included shoe.
  model: {
    url: '/models/shoe.glb',
    rotation: Math.PI / 2 - 0.4,
    camera: { azimuth: -0.14, elevation: 0.16, margin: 1.06 },
    scrollTurns: 0.625,
  },
};

/**
 * Product catalogue.
 * Prices are in TND; the first colour is the card cover. Images live in
 * /public/images. Keep this list, the WhatsApp number and the store settings
 * in this one file so the whole shop can be updated from a single place.
 */
const standardSizes = ['39', '40', '41', '42', '43', '44', '45'];

export const products = [
  {
    id: 'pegasus-ivory',
    name: 'Pegasus 36 — عاجي',
    englishName: 'Pegasus 36 / Ivory',
    category: 'Running · يومي',
    price: 289,
    oldPrice: 329,
    badge: 'جديد',
    featured: true,
    bestseller: false,
    image: '/images/product-01.webp',
    colors: [
      { id: 'ivory', name: 'عاجي', hex: '#F1ECE3', image: '/images/product-01.webp' },
      { id: 'clay', name: 'طوبي', hex: '#D97745', image: '/images/product-01-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'خط يومي هادئ بلون عاجي، ونعل مرن يرافقك من الصباح إلى المساء.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
  {
    id: 'pegasus-clay',
    name: 'Pegasus 36 — طوبي',
    englishName: 'Pegasus 36 / Clay',
    category: 'Running · إصدار',
    price: 299,
    oldPrice: null,
    badge: 'إصدار محدود',
    featured: true,
    bestseller: false,
    image: '/images/product-02.webp',
    colors: [
      { id: 'clay', name: 'طوبي', hex: '#D97745', image: '/images/product-02.webp' },
      { id: 'ivory', name: 'عاجي', hex: '#F1ECE3', image: '/images/product-02-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'لمسة طوبية دافئة على قالب خفيف، مع تفاصيل تُرى عن قرب.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
  {
    id: 'pegasus-sand',
    name: 'Pegasus 36 — رملي',
    englishName: 'Pegasus 36 / Sand',
    category: 'Lifestyle · يومي',
    price: 279,
    oldPrice: null,
    badge: 'وصل حديثًا',
    featured: true,
    bestseller: false,
    image: '/images/product-03.webp',
    colors: [
      { id: 'sand', name: 'رملي', hex: '#D8C4AC', image: '/images/product-03.webp' },
      { id: 'clay', name: 'طوبي', hex: '#D97745', image: '/images/product-03-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'درجة رملية محايدة تناسب كل يوم، بتفاصيل هادئة وخامة متنفسة.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
  {
    id: 'pegasus-mono',
    name: 'Pegasus 36 — مونو',
    englishName: 'Pegasus 36 / Mono',
    category: 'Running · الأكثر مبيعًا',
    price: 269,
    oldPrice: 299,
    badge: 'الأكثر مبيعًا',
    featured: false,
    bestseller: true,
    image: '/images/product-04.webp',
    colors: [
      { id: 'ivory', name: 'عاجي', hex: '#F1ECE3', image: '/images/product-04.webp' },
      { id: 'sand', name: 'رملي', hex: '#D8C4AC', image: '/images/product-04-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'القراءة الأحادية للقالب الأصلي: لون واحد، خطوط نظيفة، وحضور هادئ.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
  {
    id: 'pegasus-ember',
    name: 'Pegasus 36 — إمبر',
    englishName: 'Pegasus 36 / Ember',
    category: 'Lifestyle · إصدار',
    price: 289,
    oldPrice: null,
    badge: 'الأكثر مبيعًا',
    featured: false,
    bestseller: true,
    image: '/images/product-05.webp',
    colors: [
      { id: 'clay', name: 'طوبي', hex: '#D97745', image: '/images/product-05.webp' },
      { id: 'ivory', name: 'عاجي', hex: '#F1ECE3', image: '/images/product-05-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'اللون الذي يكسر الهدوء: طوبي دافئ يليق بالملابس المحايدة.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
  {
    id: 'pegasus-stone',
    name: 'Pegasus 36 — حجري',
    englishName: 'Pegasus 36 / Stone',
    category: 'Running · أسبوعي',
    price: 259,
    oldPrice: null,
    badge: 'الأكثر مبيعًا',
    featured: false,
    bestseller: true,
    image: '/images/product-06.webp',
    colors: [
      { id: 'stone', name: 'حجري', hex: '#CFC7BC', image: '/images/product-06.webp' },
      { id: 'clay', name: 'طوبي', hex: '#D97745', image: '/images/product-06-alt.webp' },
    ],
    sizes: standardSizes,
    summary: 'لون حجري عملي، مناسب للاستعمال اليومي والتنقل في المدينة.',
    details: ['شبك علوي خفيف', 'وسادة هوائية في المقدمة', 'نعل مطاطي مرن', 'بطانة ناعمة'],
  },
];

export const newArrivals = products.filter((product) => product.featured);
export const bestsellers = products.filter((product) => product.bestseller);

export function getProduct(id) {
  return products.find((product) => product.id === id);
}

export function formatPrice(value) {
  const amount = new Intl.NumberFormat(store.locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
  return `${amount} ${store.currencyLabel}`;
}

export function phoneDisplay() {
  const digits = store.whatsapp;
  if (digits.length === 11 && digits.startsWith('216')) {
    return `+216 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}

export function whatsappUrl(message = '') {
  const base = `https://wa.me/${store.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function offerDiscount(subtotal, quantity) {
  if (!store.offer.active || quantity < store.offer.minimumQuantity) return 0;
  return Math.round((subtotal * store.offer.percent) / 100);
}
