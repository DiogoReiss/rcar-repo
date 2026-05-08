import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('shows login form', async ({ page }) => {
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
    await page.getByLabel(/senha/i).fill('admin123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });
});

test.describe('Auth guard', () => {
  test('unauthenticated user is redirected to login from admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });
});

