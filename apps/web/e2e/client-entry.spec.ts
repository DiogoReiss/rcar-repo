import { expect, test } from '@playwright/test';

test.describe('Client first interaction', () => {
  test('shows anonymous-first wash and rent options with login in header', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /agendar lavagem/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /iniciar locação/i })).toBeVisible();
  });

  test('toggles theme and keeps selection after reload', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.getByRole('button', { name: /alternar tema/i });
    await themeToggle.click();

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  });

  test('allows scheduling wash without login', async ({ page }) => {
    await page.goto('/');

    const washSubmit = page.getByRole('button', { name: /confirmar agendamento/i });
    await expect(washSubmit).toBeDisabled();

    await page.locator('#contactNameWash').fill('Maria Oliveira');
    await page.locator('#contactPhoneWash').fill('(11) 99999-9999');
    await page.locator('#contactEmailWash').fill('maria@teste.com');
    await page.getByLabel(/placa do veículo/i).fill('ABC1D23');
    await page.getByLabel(/^data$/i).fill('2026-05-12');
    await page.getByLabel(/^hora$/i).fill('10:30');
    await washSubmit.click();

    await expect(page.getByText(/agendamento enviado com sucesso/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('asks login only on rental finalization', async ({ page }) => {
    await page.goto('/');

    const continueRent = page.getByRole('button', { name: /continuar sem login/i });
    await expect(continueRent).toBeDisabled();

    await page.locator('#contactNameRent').fill('Carlos Souza');
    await page.locator('#contactPhoneRent').fill('(11) 98888-7777');
    await page.locator('#contactEmailRent').fill('carlos@teste.com');
    await page.getByLabel(/retirada/i).fill('2026-05-12');
    await page.getByLabel(/devolução/i).fill('2026-05-14');
    await continueRent.click();
    await page.getByRole('link', { name: /entrar para finalizar/i }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

