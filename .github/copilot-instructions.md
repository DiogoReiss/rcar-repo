# Angular Application Development

You are working in the Angular application `project-name`. Keep this file focused on always-on coding rules for this repository. Keep repository facts in `AGENTS.md`, and use `.github/skills/angular-developer/SKILL.md` for deeper Angular workflows and reference material.

## Repository Defaults

- Angular 21 and standalone APIs are the baseline.
- Use `pnpm` and the existing package scripts before inventing ad hoc commands.
- Use the existing selector prefix `lync` for generated UI artifacts.
- Prefer the narrowest relevant validation command after changes: `pnpm build`, `pnpm lint`, `pnpm test:unit`, `pnpm test:browser`, or `pnpm test:e2e`.

## Angular Implementation Rules

- Do not add `standalone: true` in component, directive, or pipe decorators.
- Prefer `export default class Name` for new component, directive, and pipe files when the file's primary purpose is a single Angular class. Keep the class named, and use a named export only when the file intentionally exposes multiple Angular symbols.
- Prefer `inject()` over constructor injection.
- Prefer `input()` and `output()` over decorator-based inputs and outputs when touching component APIs.
- Use signals for local and derived state when they fit the problem.
- Prefer `ChangeDetectionStrategy.OnPush` for new or substantially updated components unless the existing pattern in that area requires otherwise.
- Keep templates simple and use native control flow (`@if`, `@for`, `@switch`).
- Use the `async` pipe for template-facing observables instead of manual subscriptions.
- Prefer `class` and `style` bindings over `ngClass` and `ngStyle`.
- Put host bindings in the `host` metadata instead of using `@HostBinding` or `@HostListener`.
- Use `NgOptimizedImage` for static images. Do not use it for inline base64 images.
- Do not assume globals like `new Date()` are available in templates.
- Do not use arrow functions in templates.

## State Management

- Shared state in this repository follows the NgRx Signal Store Events split-by-concern pattern.
- Keep `*-events.ts`, `*-reducers.ts`, `*-selectors.ts`, `*-effects.ts`, and `*-store.ts` separated instead of collapsing store logic into a single file.
- Prefer `Events` as the default stream in `withEventHandlers(...)`.
- Use `ReducerEvents` only when you intentionally need reducer-stream behavior.
- Keep async coordination, orchestration, and side effects in store effects instead of components.
- Components should primarily dispatch events and read selectors or signals.

## Routing and Application Setup

- Prefer lazy-loaded feature routes for feature areas.
- Keep app-wide providers in `src/app/app.config.ts`.
- Preserve the existing path aliases from `tsconfig.json` when they improve clarity.

## Structure and Naming

- Organize code by feature area, not by artifact type.
- Use kebab-case file names.
- Keep component TypeScript, template, styles, and tests colocated.
- Follow `STYLEGUIDE.MD` as an illustrative structure guide, not as a mandatory folder checklist.

## Services and Dependency Boundaries

- Design services around a single responsibility.
- Use `providedIn: 'root'` for singleton services unless a narrower scope is intentional.
- Do not move orchestration into components when a service or store boundary is the better home.

## Design System, Accessibility, and Styling

- Reuse `@bmw-ds/components` when an existing design-system primitive fits the need.
- All UI must satisfy WCAG AA and pass AXE checks.
- Preserve the existing SCSS-based styling approach unless the task requires a deliberate change.

## Testing

- Use Vitest patterns and APIs for unit and browser integration tests.
- Do not assume Jasmine or Karma APIs exist in this repository.
- `*.unit.spec.ts` is for unit-style tests.
- `*.browser.spec.ts` is for Vitest browser-mode integration tests.
- `e2e/*.spec.ts` is for Playwright end-to-end tests.

## Documentation Sync (update docs with every change)

Treat documentation as part of the definition of done. Whenever a change affects behavior, structure, or scope, update the matching doc in the **same** change. Do not duplicate detail across docs — put it in the owning doc and link to it.

| When you change... | Update this doc |
|---|---|
| Prisma schema, models, enums, or relations (`apps/api/prisma/schema.prisma`) | `docs/architecture/04-database.md` |
| Backend modules or API endpoints (`apps/api/src/modules/**`) | `docs/architecture/03-backend.md` (Swagger is the live endpoint reference) |
| Frontend feature areas, routing, or shared UI structure (`apps/web/src/app/**`) | `docs/architecture/02-frontend.md` |
| Business rules, access roles/RBAC, or domain flows | `docs/architecture/01-business.md` |
| Financial/reporting logic (COGS, pricing, DRE, stock valuation) | `docs/architecture/06-financeiro.md` |
| Completing, starting, or reprioritizing work; feature ships or is deferred | `docs/architecture/05-todo.md` (canonical status/roadmap — keep its date current) |
| Introducing a new domain term (ubiquitous language) | `docs/architecture/glossario.md` |
| Making a notable architectural/tech decision | `docs/architecture/adr.md` (append a short ADR) |
| Setup, scripts, env vars, prerequisites, or high-level overview | `README.md` (keep it quickstart + overview + links only) |

Rules:
- `docs/architecture/05-todo.md` is the single source of truth for project status/roadmap — never track status elsewhere.
- Mark unimplemented-but-documented scope as `🔴 Planejado — não implementado`; never document planned work as if shipped.
- Keep `README.md` slim: link out to the architecture docs instead of duplicating API tables, schema, or status.
- Do not recreate a `docs/progress/` folder; historical status lives only in `05-todo.md`.
- Docs are written in Portuguese — match the existing language and tone.

## Documentation Boundaries

- Keep factual repository context in `AGENTS.md`.
- Keep deep Angular workflows and reference material in `.github/skills/angular-developer/SKILL.md` and its `references/` folder.
- Keep this file concise, always-on, and biased toward implementation rules that should apply on most changes.
- Avoid duplicating factual inventory that already belongs in `AGENTS.md`.
