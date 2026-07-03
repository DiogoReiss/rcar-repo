/** Registers the hand-rolled portal service worker (public/sw.js) for
 * installability and basic offline support. Safe no-op where the API is
 * unavailable (e.g. SSR or unit-test environments). */
export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', function onLoad() {
    navigator.serviceWorker.register('/sw.js').catch(function onError(err) {
      console.error('Service worker registration failed', err);
    });
  });
}
