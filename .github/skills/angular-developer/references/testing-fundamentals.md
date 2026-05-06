# Testing Fundamentals

This repository uses Vitest for two complementary types of automated tests:

- **Unit tests** in `src/**/*.unit.spec.ts` for isolated logic, routing, and Angular configuration.
- **Browser integration tests** in `src/**/*.browser.spec.ts` for rendered UI behavior in a real browser through Vitest Browser Mode.

Use this guide for both. Full end-to-end flows belong in the Playwright E2E suite described in `e2e-testing.md`.

## Choosing the Right Test Type

- **Use `*.unit.spec.ts`** when you want to validate logic, dependency wiring, route resolution, or other behavior that does not need a real browser rendering environment.
- **Use `*.browser.spec.ts`** when you want to validate what the user actually sees in the browser: rendered text, accessible roles, visible controls, and UI interactions.
- **Use Playwright E2E** when the test must cover the fully running application, navigation across routes, or cross-page user journeys.

## Core Philosophy: Zoneless & Async-First

This project follows a modern, zoneless testing approach. State changes schedule updates asynchronously, and tests must account for this.

**Do NOT** use `fixture.detectChanges()` to manually trigger updates.
**ALWAYS** use the "Act, Wait, Assert" pattern:

1.  **Act:** Update state or perform an action (e.g., set a component input, click a button).
2.  **Wait:** Use `await fixture.whenStable()` to allow the framework to process the scheduled update and render the changes.
3.  **Assert:** Verify the outcome.

### Basic Unit Test Structure Example

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let h1: HTMLElement;

  beforeEach(async () => {
    // 1. Configure the test module
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    // 2. Create the component fixture
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    h1 = fixture.nativeElement.querySelector('h1');
  });

  it('should display the default title', async () => {
    // ACT: (Implicit) Component is created with default state.
    // WAIT for initial data binding.
    await fixture.whenStable();
    // ASSERT the initial state.
    expect(h1.textContent).toContain('Default Title');
  });

  it('should display a different title after a change', async () => {
    // ACT: Change the component's title property.
    component.title.set('New Test Title');

    // WAIT for the asynchronous update to complete.
    await fixture.whenStable();

    // ASSERT the DOM has been updated.
    expect(h1.textContent).toContain('New Test Title');
  });
});
```

For routing-focused unit tests, prefer `RouterTestingHarness`. This repository already uses that pattern in `src/app/app.routes.unit.spec.ts`.

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

describe('Application routing', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });

    harness = await RouterTestingHarness.create('');
    router = TestBed.inject(Router);
  });

  it('should be on the default route', () => {
    expect(router.url).toBe('/feat-one/dashboard');
  });
});
```

## TestBed and ComponentFixture

- **`TestBed`**: The primary utility for creating a test-specific Angular module. Use `TestBed.configureTestingModule({...})` in your `beforeEach` to declare components, provide services, and set up imports needed for your test.
- **`ComponentFixture`**: A handle on the created component instance and its environment.
  - `fixture.componentInstance`: Access the component's class instance.
  - `fixture.nativeElement`: Access the component's root DOM element.
  - `fixture.debugElement`: An Angular-specific wrapper around the `nativeElement` that provides safer, platform-agnostic ways to query the DOM (e.g., `debugElement.query(By.css('p'))`).

## Browser Integration Tests (`*.browser.spec.ts`)

This repository treats `*.browser.spec.ts` files as integration tests. They still run under Vitest, but they execute in a real browser using the `browser` test project configured in `vite.config.ts`:

- test project name: `browser`
- included files: `src/**/*.browser.spec.{ts,tsx}`
- browser provider: `@vitest/browser-playwright`
- browser instance: Chromium

Global setup for these tests lives in `src/test-setup.ts`:

```ts
setupTestBed({ browserMode: true, providers: [provideImprint()] });
```

That means browser specs can create standalone Angular components with `TestBed.createComponent(...)` and then assert against the rendered page using `page` from `vitest/browser`.

### Browser Integration Test Example

This is the main pattern already used in the repository:

```ts
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';

import App from './app';

describe('My application chrome', () => {
  beforeEach(() => {
    TestBed.createComponent(App);
  });

  it('should render title', async () => {
    await expect.element(page.getByText('My application')).toBeVisible();
  });

  it('should render both features access buttons', async () => {
    await expect.element(page.getByRole('listitem')).toHaveLength(2);
  });
});
```

### When to Write a Browser Spec

Reach for a `*.browser.spec.ts` file when the behavior depends on actual rendering or browser semantics, for example:

- checking visible text, headings, buttons, links, and lists
- asserting ARIA roles or other accessibility-oriented selectors
- verifying that a component renders the correct UI from its default state
- validating simple user interaction through browser locators

If the test only needs class-level logic or router navigation without browser rendering, prefer a `*.unit.spec.ts` file instead.

### Browser Test Best Practices

- **Prefer semantic locators:** Use `page.getByRole(...)`, `page.getByText(...)`, and similar queries before falling back to brittle selectors.
- **Keep setup minimal:** Most browser specs in this repository only need `TestBed.createComponent(Component)` in `beforeEach`.
- **Await browser assertions:** Use `await expect.element(...)` so the assertion can wait for the rendered state.
- **Test user-visible outcomes:** Assert what appears on screen rather than internal implementation details.
- **Keep scope local:** These are integration tests for a component or feature area, not substitutes for full E2E coverage.

## Test Commands

Use the scripts from `package.json` to run the appropriate test scope:

- `pnpm test:unit` for unit tests in CI mode
- `pnpm test:unit:watch` for local unit test development
- `pnpm test:browser` for browser integration tests in CI mode
- `pnpm test:browser:watch` for local browser integration test development
- `pnpm test:all:dev` for both local unit and integration tests
- `pnpm test:all:ci` for both CI mode unit and integration tests
- `pnpm test:e2e` for Playwright end-to-end tests

Use the smallest test type that proves the behavior with confidence.
