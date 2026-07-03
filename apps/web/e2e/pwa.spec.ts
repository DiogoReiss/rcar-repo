import { expect, test } from '@playwright/test';

test.describe('Portal PWA', () => {
  test('exposes an installable manifest with icon and theme', async ({ page }) => {
    await page.goto('/');

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestHref).toBeTruthy();

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute('content');
    expect(themeColor).toBe('#ec8609');

    const manifest = await page.request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    const body = await manifest.json();
    expect(body.display).toBe('standalone');
    expect(Array.isArray(body.icons)).toBeTruthy();
    expect(body.icons.length).toBeGreaterThan(0);

    const icon = await page.request.get('/icons/icon.svg');
    expect(icon.ok()).toBeTruthy();
  });

  test('registers a service worker and serves the app shell offline', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    await page.waitForFunction(function waitForController() {
      return (
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller !== null
      );
    });

    // Warm the cache with a navigation while online.
    await page.reload();
    await page.waitForFunction(function waitForController() {
      return navigator.serviceWorker.controller !== null;
    });

    await context.setOffline(true);
    await page.reload();

    // App shell (root element) still resolves from the service-worker cache.
    await expect(page.locator('lync-root')).toBeAttached();

    await context.setOffline(false);
  });
});
