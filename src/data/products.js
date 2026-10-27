/**
 * Backwards-compatible product entry point.
 *
 * The catalogue lives in `store.js` so the products, prices, sizes, colours,
 * images and WhatsApp number can all be edited from one data file.
 */
export { products, newArrivals, bestsellers, getProduct } from './store.js';
