import { test, expect } from '@playwright/test';

// Shared login helper
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

const adminRoutes = [
  '/admin',
  '/admin/usuarios',
  '/admin/servicos',
  '/admin/estoque',
  '/admin/frota',
  '/admin/clientes',
  '/admin/templates',
  '/admin/financeiro',
];

test.describe('Admin happy paths', () => {
  test('navigates through core admin routes', async ({ page }) => {
    await adminLogin(page);
    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

