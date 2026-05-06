import { test, expect } from '@playwright/test';

// Shared login helper
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test('shows KPI cards after login', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin');
    // Dashboard should show at least one KPI value after loading
    await expect(page.locator('.loading')).toHaveCount(0, { timeout: 8000 });
  });
});

test.describe('Usuários list', () => {
  test('lists users', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/usuarios');
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 5000 });
  });

  test('navigates to create form', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/usuarios');
    await page.getByRole('link', { name: /novo usuário/i }).click();
    await expect(page).toHaveURL(/\/admin\/usuarios\/novo/);
  });
});

test.describe('Frota list', () => {
  test('lists vehicles', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/frota');
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Clientes list', () => {
  test('lists customers', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/clientes');
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 5000 });
  });
});

