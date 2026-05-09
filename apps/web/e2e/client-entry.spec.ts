import { expect, test } from '@playwright/test';

test.describe('Client first interaction', () => {
  test('shows reserve/rent options and login in header', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /reservar veículo/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /alugar agora/i })).toBeVisible();
  });

  test('reserve CTA routes to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /reservar veículo/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

