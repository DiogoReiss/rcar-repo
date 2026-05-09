import { test, expect } from '@playwright/test';

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-mail/i).fill('admin@rcar.com.br');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Templates editor', () => {
  test('creates a new template from admin', async ({ page }) => {
    await adminLogin(page);

    await page.goto('/admin/templates');
    await page.getByRole('button', { name: /\+ novo template/i }).click();

    await page.locator('input[name="createName"]').fill('Template de Teste E2E');
    await page.locator('select[name="createTipo"]').selectOption('RECIBO_LAVAGEM');

    await page.locator('select[name="createVariableToAdd"]').selectOption('servico');
    await page.getByRole('button', { name: /^Adicionar$/ }).first().click();

    await page.locator('textarea[name="createContent"]').fill('<h2>Recibo Teste</h2><p>{{nomeCliente}}</p><p>{{servico}}</p>');
    await page.getByRole('button', { name: /criar template/i }).click();

    await expect(page.getByRole('heading', { name: /editar: template de teste e2e/i })).toBeVisible();
    await expect(page.locator('[data-testid="template-rich-editor"]')).toContainText('{{servico}}');
  });

  test('inserts variable chips and previews with mock data', async ({ page }) => {
    await adminLogin(page);

    await page.goto('/admin/templates');
    await expect(page.getByRole('heading', { name: /templates de documentos/i })).toBeVisible();

    await page.getByRole('button', { name: /editar \/ preview/i }).first().click();

    await page.locator('select[name="editVariableToAdd"]').selectOption('emailCliente');
    await page.getByRole('button', { name: /^Adicionar$/ }).first().click();

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
    await page.locator('.palette-chip', { hasText: '{{emailCliente}}' }).click();

    await expect(editor).toContainText('{{emailCliente}}');
    await expect(editor.locator('.template-token[data-token="{{emailCliente}}"]')).toBeVisible();

    await page.locator('input[name="pvars"]').fill(
      '{"nomeCliente":"Joao","emailCliente":"joao@rcar.dev"}',
    );
    await page.getByRole('button', { name: /renderizar/i }).click();

    await expect(page.locator('.preview-frame')).toContainText('joao@rcar.dev');
  });
});



