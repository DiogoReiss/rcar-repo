import { test, expect } from '@playwright/test';

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Templates editor', () => {
  test('inserts variable chips and previews with mock data', async ({ page }) => {
    await adminLogin(page);

    await page.goto('/admin/templates');
    await expect(page.getByRole('heading', { name: /templates de documentos/i })).toBeVisible();

    await page.getByRole('button', { name: /editar \/ preview/i }).first().click();

    const varsInput = page.locator('input[name="vars"]');
    await varsInput.fill('nomeCliente, valorTotal, assinaturaDigital');

    const editor = page.locator('[data-testid="template-rich-editor"]');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('{{nomeCliente}} {{valorTotal}}');

    await page.getByRole('button', { name: /^H2$/ }).click();
    await page.getByRole('button', { name: /^Link$/ }).click();
    await page.locator('input[name="linkUrl"]').fill('https://rcar.dev/docs');
    await page.locator('input[name="linkText"]').fill('Documentacao RCar');
    await page.getByRole('button', { name: /^Inserir$/ }).click();

    await editor.press('End');
    await page.getByRole('button', { name: '{{assinaturaDigital}}' }).click();

    await expect(editor).toContainText('{{assinaturaDigital}}');
    await expect(editor.locator('.template-token[data-token="{{assinaturaDigital}}"]')).toBeVisible();

    await page.locator('input[name="pvars"]').fill(
      '{"nomeCliente":"Joao","valorTotal":"199.90","assinaturaDigital":"Assinado digitalmente"}',
    );
    await page.getByRole('button', { name: /renderizar/i }).click();

    await expect(page.locator('.preview-frame')).toContainText('Assinado digitalmente');
  });
});



