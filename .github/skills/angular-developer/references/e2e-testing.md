# End-to-End (E2E) Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end (E2E) testing. The test suite lives in `e2e/`, uses shared fixtures from `e2e/fixtures/`, and is configured through `playwright.config.ts`.

## Running E2E Tests

The primary way to run E2E tests is through the scripts defined in the root `package.json`.

1.  **Start the Angular app:** Playwright is configured with `baseURL: 'http://localhost:4200'`, so the app must be running before the test suite starts.

    ```shell
    pnpm start:dev
    ```

2.  **Run Playwright:** In another terminal, execute the E2E suite.

    ```shell
    pnpm test:e2e
    ```

3.  **Useful local workflows:** Playwright also supports running a single spec, UI mode, or opening the HTML report.

    ```shell
    npx playwright test e2e/home-page.spec.ts
    npx playwright test --ui
    npx playwright show-report .artifacts/playwright/report
    ```

## Test Structure

- **Configuration:** Shared Playwright settings live in `playwright.config.ts`.
- **Specs:** Test files live in `e2e/*.spec.ts`.
- **Fixtures:** Shared fixtures and page-object-style helpers live in `e2e/fixtures/`.
- **Artifacts:** Results and reports are written under `.artifacts/playwright/`.

### Example E2E Test Snippet

A typical Playwright test in this repository looks like this:

```typescript
import { expect } from '@playwright/test';

import { test } from './fixtures';

test('get started link', async ({ homePage }) => {
  await homePage.goToHomePage();

  await homePage.getHomeLink().click();

  await expect(homePage.getHomeHeading()).toBeVisible();
});
```

The shared fixture keeps repeated page interactions out of the spec:

```typescript
import { Locator, Page, test as base } from '@playwright/test';

export class HomePageFixture {
  constructor(private readonly page: Page) {}

  async goToHomePage(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
  }

  getHomeLink(): Locator {
    return this.page.getByRole('link', { name: 'Get started', exact: true });
  }

  getHomeHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Installation', exact: true });
  }
}

export const test = base.extend<{ homePage: HomePageFixture }>({
  homePage: async ({ page }, use) => {
    await use(new HomePageFixture(page));
  },
});
```

### Best Practices

- **Prefer semantic locators:** Use Playwright locators such as `getByRole`, `getByLabel`, and `getByText` before falling back to test ids or CSS selectors.
- **Keep setup in fixtures:** Put repeated flows and page-object-style helpers in `e2e/fixtures/` so specs stay short and focused on assertions.
- **Avoid arbitrary waits:** Do not use `page.waitForTimeout()` unless there is no better signal. Prefer `expect(...)` assertions and locator auto-waiting.
- **Use the configured `baseURL`:** Keep navigation relative when testing the local Angular app so the suite stays portable across local and CI environments.
- **Debug with artifacts:** Keep Playwright traces, screenshots, and videos enabled on failures to speed up diagnosis of flaky or failing tests.
