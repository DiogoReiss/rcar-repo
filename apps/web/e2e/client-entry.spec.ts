import { expect, test } from '@playwright/test';

test.describe('Client first interaction', () => {
  test('shows anonymous-first wash and rent options with login in header', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /agendar lavagem/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /iniciar locação/i })).toBeVisible();
  });

  test('allows scheduling wash without login', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/placa do veículo/i).fill('ABC1D23');
    await page.getByLabel(/^data$/i).fill('2026-05-12');
    await page.getByLabel(/^hora$/i).fill('10:30');
    await page.getByRole('button', { name: /confirmar agendamento/i }).click();

    await expect(page.getByText(/agendamento enviado com sucesso/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('asks login only on rental finalization', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/retirada/i).fill('2026-05-12');
    await page.getByLabel(/devolução/i).fill('2026-05-14');
    await page.getByRole('button', { name: /continuar sem login/i }).click();
    await page.getByRole('link', { name: /entrar para finalizar/i }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

