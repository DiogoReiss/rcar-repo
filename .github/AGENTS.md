---
trigger: always_on
---

This repository contains the Angular application `project-name`. Keep this file factual and repository-specific. Put broad coding rules in `.github/copilot-instructions.md`, and use `.github/skills/angular-developer/SKILL.md` for deeper Angular workflows and reference material.

## Repository Summary

- Framework: Angular 21
- Package manager: `pnpm`
- Build system: `@angular/build:application`
- Unit and browser integration tests: Vitest via Analog
- End-to-end tests: Playwright
- Design system: `@bmw-ds/components`
- Selector prefix: `lync`

## Project Structure

- `src/` application source code
- `src/app/` root application code, feature areas, routing, providers, and shared state
- `src/app/core/store/` shared NgRx Signal Store Events state (`main-events.ts`, `main-reducers.ts`, `main-selectors.ts`, `main-effects.ts`, `main-store.ts`)
- `src/app/feature-one/`, `src/app/feature-two/` lazily loaded feature areas
- `public/` static assets copied directly into the build output
- `e2e/` Playwright end-to-end tests
- `tools/` development tooling and helper assets, not runtime application code

## Repository Patterns

- Shared state is organized with the Signal Store Events split-by-concern pattern:
  - `*-events.ts`
  - `*-reducers.ts`
  - `*-selectors.ts`
  - `*-effects.ts`
  - `*-store.ts`
- Root routing lazy-loads feature route files from `feature-one` and `feature-two`.
- Global app providers are configured in `src/app/app.config.ts`, including `provideImprint()`.

## Imports and Paths

- Path aliases defined in `tsconfig.json`:
  - `@feature-one/*` -> `src/app/feature-one/*`
  - `@feature-two/*` -> `src/app/feature-two/*`
  - `@app/config` -> `src/app/app.config.ts`
  - `@app/environments/*` -> `src/environments/*`

## Testing Notes

- `*.spec.ts` is for unit-style tests.
- `*.browser.spec.ts` is for Vitest browser-mode integration tests.
- `e2e/*.spec.ts` is for Playwright end-to-end tests.
- Vitest unit setup lives in `src/test-setup.unit.ts`.
- Tests in this repository use Vitest and Playwright rather than Jasmine or Karma.

## Common Commands

- `pnpm build`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:browser`
- `pnpm test:e2e`

## References

- Repository structure example: `STYLEGUIDE.MD`
- Always-on coding rules: `.github/copilot-instructions.md`
- Angular skill and local reference docs: `.github/skills/angular-developer/SKILL.md` and `.github/skills/angular-developer/references/`
