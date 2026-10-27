import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { products } from './data/products.js';
import { formatPrice, phoneDisplay, store, whatsappUrl } from './data/store.js';
import { applyCardColor, renderCatalogue } from './ui/catalogue.js';
import { initCart, renderBag } from './ui/cart.js';
import { initProductDialog, openProduct } from './ui/productModal.js';
import { genericMessage } from './ui/whatsapp.js';
import { initToast } from './ui/toast.js';
import { bindBackdropClose, closeDialog, openDialog } from './ui/dialogs.js';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('[data-header]');
const menuDialog = document.querySelector('[data-menu-dialog]');
const cartDialog = document.querySelector('[data-cart-dialog]');
const productDialog = document.querySelector('[data-product-dialog]');
const heroSection = document.querySelector('.hero');
const stage = document.querySelector('[data-stage]');
const canvasHost = document.querySelector('[data-canvas-host]');
const modelStatus = document.querySelector('[data-model-status]');
const modelLabel = document.querySelector('[data-model-label]');
const modelProgress = document.querySelector('[data-model-progress]');
const modelError = document.querySelector('[data-model-error]');
const modelErrorText = document.querySelector('[data-model-error-text]');
const modelRetry = document.querySelector('[data-model-retry]');

let lenis = null;
let heroController = null;
let heroTrigger = null;

function setStoreCopy() {
  document.querySelectorAll('[data-announcement]').forEach((node) => {
    node.textContent = store.announcement;
  });
  document.querySelectorAll('[data-phone]').forEach((node) => {
    node.textContent = phoneDisplay();
  });
  document.querySelectorAll('[data-hours]').forEach((node) => {
    node.textContent = store.hours;
  });
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const waUrl = whatsappUrl(genericMessage());
  document.querySelectorAll('[data-wa-link]').forEach((link) => {
    link.href = waUrl;
  });

  const heroProduct = products[0];
  const heroModel = document.querySelector('[data-hero-model]');
  const heroPrice = document.querySelector('[data-hero-price]');
  const heroColor = document.querySelector('[data-hero-color]');
  if (heroProduct && heroModel) heroModel.textContent = heroProduct.englishName;
  if (heroProduct && heroPrice) {
    const amount = formatPrice(heroProduct.price).replace(store.currencyLabel, '').trim();
    const unit = document.createElement('span');
    unit.textContent = store.currencyLabel;
    heroPrice.replaceChildren(document.createTextNode(`${amount} `), unit);
  }
  if (heroProduct && heroColor) {
    heroColor.textContent = `اللون: ${heroProduct.colors[0].name}`;
  }

  const offer = document.querySelector('[data-offer]');
  if (offer) offer.hidden = !store.offer.active;
  if (store.offer.active) {
    const title = document.querySelector('[data-offer-title]');
    if (title) {
      const accent = document.createElement('em');
      accent.textContent = store.offer.titleAccent;
      title.replaceChildren(document.createTextNode(store.offer.titleTop), document.createElement('br'), accent);
    }
    const description = document.querySelector('[data-offer-description]');
    if (description) description.textContent = store.offer.description;
    const note = document.querySelector('[data-offer-note]');
    if (note) note.textContent = store.offer.short;
    const percent = document.querySelector('[data-offer-percent]');
    if (percent) percent.textContent = `−${store.offer.percent}%`;
    const stampNote = document.querySelector('[data-offer-stamp-note]');
    if (stampNote) stampNote.textContent = store.offer.stampNote;
    const offerImage = document.querySelector('[data-offer-image]');
    if (offerImage && products[0]) offerImage.alt = `${heroProduct.name} — ${heroProduct.colors[0].name}`;
  }
}

function openBag() {
  renderBag();
  openDialog(cartDialog);
}

function initChrome() {
  document.querySelector('[data-menu-open]')?.addEventListener('click', () => openDialog(menuDialog));
  document.querySelectorAll('[data-menu-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(menuDialog));
  });

  document.querySelectorAll('[data-cart-open]').forEach((button) => {
    button.addEventListener('click', openBag);
  });
  document.querySelectorAll('[data-cart-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(cartDialog));
  });

  [menuDialog, cartDialog, productDialog].forEach(bindBackdropClose);

  window.addEventListener('dialog:change', (event) => {
    if (event.detail.open) lenis?.stop();
    else lenis?.start();
  });

  initToast(openBag);

  // One delegated listener keeps dynamically rendered cards interactive.
  document.addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-card-color]');
    if (swatch) {
      applyCardColor(swatch);
      return;
    }

    const quickView = event.target.closest('[data-quick-view]');
    if (quickView) {
      openProduct(quickView.dataset.quickView);
      return;
    }

    const add = event.target.closest('[data-card-add]');
    if (add) {
      openProduct(add.dataset.cardAdd);
      return;
    }

    const whatsapp = event.target.closest('[data-card-wa]');
    if (whatsapp) {
      openProduct(whatsapp.dataset.cardWa);
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip-link')) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    const dialog = link.closest('dialog');
    if (dialog) {
      dialog.close();
      window.setTimeout(() => scrollToTarget(target), 170);
    } else {
      scrollToTarget(target);
    }
  });

  let scrollQueued = false;
  const syncHeader = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 14);
      scrollQueued = false;
    });
  };
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
}

function scrollToTarget(target) {
  if (lenis) {
    lenis.scrollTo(target, {
      duration: reduceMotion.matches ? 0 : 1.15,
    });
    return;
  }
  target.scrollIntoView({
    behavior: reduceMotion.matches ? 'auto' : 'smooth',
    block: 'start',
  });
}

function initSmoothScroll() {
  if (reduceMotion.matches) return;

  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.1,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

function initMotion() {
  if (reduceMotion.matches) {
    document.documentElement.classList.add('reduced-motion');
    return;
  }

  gsap.from('.hero-title .line > span', {
    yPercent: 118,
    duration: 1.15,
    ease: 'power4.out',
    stagger: 0.11,
    delay: 0.12,
  });

  gsap.from('.hero-copy .eyebrow, .hero-sub, .hero-actions, .hero-facts', {
    y: 20,
    autoAlpha: 0,
    duration: 0.85,
    ease: 'power2.out',
    stagger: 0.08,
    delay: 0.32,
  });

  gsap.from('.hero-stage', {
    autoAlpha: 0,
    y: 24,
    duration: 1.2,
    delay: 0.2,
    ease: 'power3.out',
  });

  gsap.from('.stage-halo, .stage-ring', {
    autoAlpha: 0,
    scale: 0.94,
    duration: 1.6,
    delay: 0.35,
    stagger: 0.12,
    ease: 'power2.out',
  });

  const revealTargets = gsap.utils.toArray(
    '.section-heading, .section-intro, .craft-copy > *, .craft-media, .offer-copy > *, .offer-media, .why-card, .faq-aside > *, .faq-list details, .contact-top, .contact-body > *, .contact-bottom',
  );

  revealTargets.forEach((element) => {
    gsap.from(element, {
      y: 24,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 89%',
        once: true,
      },
    });
  });

  ScrollTrigger.batch('.product-card, .best-feature, .best-row', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      gsap.from(batch, {
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.08,
      });
    },
  });

  if (window.matchMedia('(min-width: 981px)').matches) {
    gsap.to('.craft-image-wrap img', {
      yPercent: 4,
      ease: 'none',
      scrollTrigger: {
        trigger: '.craft-media',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function setModelStatus(text, progress) {
  if (modelLabel) modelLabel.textContent = text;
  if (modelProgress) modelProgress.textContent = progress == null ? '' : `${progress}%`;
}

function showModelError(error) {
  stage?.classList.remove('is-model-ready');
  stage?.classList.add('is-fallback');
  setModelStatus('', null);
  if (modelStatus) modelStatus.style.opacity = '0';
  if (import.meta.env.DEV) {
    if (modelError) modelError.hidden = false;
    if (modelErrorText) {
      const detail = `${error?.message || error}`;
      modelErrorText.textContent = /webgl/i.test(detail)
        ? `${detail} — WebGL غير متاح في هذا المتصفح، وتُعرض صورة بديلة.`
        : `${detail} — الملف المتوقع: ${store.model.url}`;
    }
  }
}

async function initHero() {
  if (!canvasHost || !stage) return;

  if (modelError) modelError.hidden = true;
  if (modelStatus) modelStatus.style.opacity = '';
  stage.classList.remove('is-model-ready', 'is-fallback');
  setModelStatus('جارٍ تحميل النموذج ثلاثي الأبعاد…', null);

  try {
    const { initHeroScene } = await import('./three/heroScene.js');
    heroController = initHeroScene({
      host: canvasHost,
      stage,
      modelUrl: store.model.url,
      pose: store.model,
      reducedMotion: reduceMotion.matches,
      onProgress: (percent) => {
        setModelStatus('جارٍ تحميل النموذج ثلاثي الأبعاد…', percent);
      },
      onReady: (details) => {
        stage.classList.add('is-model-ready');
        stage.classList.remove('is-fallback');
        setModelStatus('', null);
        window.__heroReady = true;
        console.info('[KHOTWA] hero model ready', {
          size: details.size,
          triangles: details.triangles,
          license: details.license,
        });
        if (heroTrigger) heroController?.setProgress(heroTrigger.progress);
      },
      onError: showModelError,
    });

    if (!heroController) return;
    window.__heroController = heroController;
    if (heroTrigger) heroController.setProgress(heroTrigger.progress);
  } catch (error) {
    showModelError(error);
  }
}

function initHeroScroll() {
  if (!heroSection) return;
  heroTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => heroController?.setProgress(self.progress),
    onRefresh: (self) => heroController?.setProgress(self.progress),
  });
  window.__heroTrigger = heroTrigger;
}

function initRetry() {
  modelRetry?.addEventListener('click', () => {
    heroController?.dispose();
    heroController = null;
    window.__heroController = null;
    window.__heroReady = false;
    if (canvasHost) canvasHost.innerHTML = '';
    initHero();
  });
}

setStoreCopy();
renderCatalogue();
initCart();
initProductDialog();
initChrome();
initSmoothScroll();
initMotion();
initHeroScroll();
initHero();
initRetry();

// Handy during local QA; harmless in production.
window.__khotwa = {
  store,
  openProduct,
  openBag,
  get hero() {
    return heroController;
  },
};
