# Angular Structure Style Guide

This document is based on the Angular Style Guide:

- https://angular.dev/style-guide

It is an **illustrative guide**, not a mandatory checklist of folders. The goal is to show how an Angular application can be organized by **feature area** and how files should be named consistently.

Do not create folders just because they appear in the example. Create only the folders that fit the real needs of the application.

## Core Principles

- Keep Angular UI code inside `src/`.
- Bootstrap the application from `src/main.ts`.
- Organize code by **feature area**, not by artifact type.
- Group closely related files together in the same directory.
- Prefer one main concept per file.
- Keep tests next to the code they verify.
- When in doubt, prefer consistency with the existing feature area.

## Naming Conventions

- Use **kebab-case** file names.
- Match the file name to the primary TypeScript identifier or feature concept.
- Components should usually share the same base name across TypeScript, template, and styles:
  - `user-profile.ts`
  - `user-profile.html`
  - `user-profile.scss`
- Avoid vague names such as `helpers.ts`, `utils.ts`, or `common.ts`.
- Route files should usually follow the pattern `<feature>.routes.ts`.
- Shared store files should use clear suffixes such as:
  - `*-events.ts`
  - `*-reducers.ts`
  - `*-selectors.ts`
  - `*-effects.ts`
  - `*-store.ts`

## Testing File Names

The Angular style guide recommends colocated tests and `.spec.ts` naming. In this repository, the same idea is adapted to the current test setup:

- `*.spec.ts` for unit tests
- `e2e/*.spec.ts` for Playwright end-to-end tests

Keep tests next to the code under test whenever possible.
