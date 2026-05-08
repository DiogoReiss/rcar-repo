import { test, expect } from '@playwright/test';

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Feature happy paths', () => {
  test('navigates lavajato routes', async ({ page }) => {
    await adminLogin(page);

    const routes = ['/lavajato/agendamento', '/lavajato/fila', '/lavajato/atendimentos'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('navigates aluguel route', async ({ page }) => {
    await adminLogin(page);

    await page.goto('/aluguel/contratos');
    await expect(page).toHaveURL(/\/aluguel\/contratos/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigates portal routes', async ({ page }) => {
    await adminLogin(page);

    const routes = [
      '/portal/meus-agendamentos',
      '/portal/minhas-reservas',
      '/portal/meus-documentos',
      '/portal/historico',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.locator('body')).toBeVisible();
    }
  });
});


