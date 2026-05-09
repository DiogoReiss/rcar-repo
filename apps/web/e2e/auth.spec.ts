import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('shows login form', async ({ page }) => {
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/auth/register"]')).toBeVisible();
  });

  test('navigates back to landing from login', async ({ page }) => {
    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('creates account and redirects to login', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/\/auth\/register/);

    await page.getByLabel(/nome completo/i).fill('Novo Cliente');
    await page.getByLabel(/^e-mail$/i).fill('novo-cliente@rcar.dev');
    await page.getByLabel(/^senha$/i).fill('senha1234');
    await page.getByLabel(/confirmar senha/i).fill('senha1234');
    await page.getByRole('button', { name: /criar conta/i }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByLabel(/e-mail/i)).toHaveValue('novo-cliente@rcar.dev');
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
    await page.getByLabel(/senha/i).fill('admin123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });
});

test.describe('Auth guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('unauthenticated user is redirected to login from admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('unauthenticated user is redirected to login from portal route', async ({ page }) => {
    await page.goto('/portal/historico');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('blocks submit while required fields are empty', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /entrar/i });
    await expect(submitButton).toBeDisabled();

    await page.getByLabel(/e-mail/i).fill('admin@rcar.dev');
    await expect(submitButton).toBeDisabled();
  });
});

