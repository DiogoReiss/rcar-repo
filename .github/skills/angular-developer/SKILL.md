---
name: angular-developer
description: 'Use when: creating or refactoring Angular code; working on standalone components, services, routes, forms, signals, NgRx Signal Store Events (eventGroup, reducers, selectors, effects), dependency injection, accessibility, styling, Vitest or Playwright tests, or Angular CLI and MCP workflows.'
---

# Angular Developer Guidelines

Use this skill for Angular-specific workflows, reference routing, and deeper implementation guidance. Keep factual repository context in `AGENTS.md` and always-on coding rules in `.settings/copilot-instructions.md`.

## Start With Workspace Context

1. Always identify the Angular version and workspace conventions before providing guidance or generating code. In an existing repository, inspect `angular.json`, `package.json`, and the current application structure instead of assuming defaults.
2. Respect the workspace package manager, build pipeline, and test runner already documented in `AGENTS.md` and `.settings/copilot-instructions.md`.
3. Prefer workspace-aware commands over global assumptions. In an existing repository, favor `pnpm exec ng ...` or the package scripts already defined by the project.
4. After making changes, validate them with the narrowest relevant command first, following the repository defaults already defined in `.settings/copilot-instructions.md`.

## Scope Of This Skill

- Treat `.settings/copilot-instructions.md` as the source of always-on implementation rules.
- Treat `AGENTS.md` as the source of factual repository context.
- Use this skill to decide which Angular reference to open next and how to approach Angular-specific tasks in this workspace.
- If a local reference and the repository conventions diverge, follow `AGENTS.md` and `.settings/copilot-instructions.md`.
- Keep detailed guidance in references instead of expanding this file into a second instructions document.

## TypeScript

When TypeScript structure or typing quality is part of the task, read [typescript-best-practices.md](references/typescript-best-practices.md).

## Creating New Projects

If the user asks to create a new Angular project:

1. Use the latest stable version of Angular unless the user specifies otherwise.
2. If the user requests a specific Angular version, prefer `pnpm dlx @angular/cli@<requested_version> new <project-name> --package-manager pnpm`.
3. If no specific version is requested and Angular CLI is already installed, `ng new <project-name> --package-manager pnpm` is acceptable.
4. If no specific version is requested and Angular CLI is not installed, use `pnpm dlx @angular/cli@latest new <project-name> --package-manager pnpm`.
5. Clarify routing, styling, SSR, and package-manager choices when those decisions materially affect the generated project.

## Components

When working with Angular components, consult the following references based on the task:

- For new component examples and generated snippets, prefer `export default class ComponentName` for the main component class.
- Keep the class named even when using a default export so Angular metadata, stack traces, and symbol names remain readable.
- Only use a named export for the component class when the example explicitly needs multiple exported symbols from the same file.
- Apply the same default-export preference to directive and pipe examples when a file declares a single primary Angular type.

- **Fundamentals**: anatomy, metadata, lifecycle, and template control flow. Read [components.md](references/components.md)
- **Inputs**: signal-based inputs, transforms, and model inputs. Read [inputs.md](references/inputs.md)
- **Outputs**: output APIs and custom event patterns. Read [outputs.md](references/outputs.md)
- **Host Elements**: host bindings and attribute injection. Read [host-elements.md](references/host-elements.md)

If the local references are insufficient, use the official Angular component documentation at `https://angular.dev/guide/components`.

## Reactivity and State Management

When managing state and data reactivity, use Angular Signals first and align with the state pattern already present in the workspace.

- **Signals Overview**: core signal concepts (`signal`, `computed`), reactive contexts, and `untracked`. Read [signals-overview.md](references/signals-overview.md)
- **Dependent State (`linkedSignal`)**: writable state linked to source signals. Read [linked-signal.md](references/linked-signal.md)
- **Async Reactivity (`resource`)**: fetching async data into signal state. Read [resource.md](references/resource.md)
- **Side Effects (`effect`)**: side effects, logging, and DOM integration. Read [effects.md](references/effects.md)
- **Shared State**: NgRx Signal Store Events patterns and file organization. Read [state-management.md](references/state-management.md)

In this repository, shared state uses NgRx Signal Store Events. Keep events, reducers, side effects, selectors, and the store composition separated instead of pushing orchestration back into components.

Use `state-management.md` for concrete examples and workflow guidance; keep always-on store rules in `.settings/copilot-instructions.md`.

## Forms

Choose the form strategy based on project maturity and API stability:

- Prefer Reactive Forms for established production code and when you need a stable default.
- Consider Signal Forms for Angular v21+ greenfield work when experimental APIs are acceptable.
- Do not switch an existing codebase to Signal Forms opportunistically without a reason.

- **Reactive Forms**: use for stable, production-oriented forms. Read [reactive-forms.md](references/reactive-forms.md)
- **Signal Forms**: use when the task explicitly accepts experimental Angular forms APIs. Read [signal-forms.md](references/signal-forms.md)

## Dependency Injection

When implementing dependency injection in Angular, follow these references:

- **Fundamentals**: services and the `inject()` function. Read [di-fundamentals.md](references/di-fundamentals.md)
- **Creating and Using Services**: creating services and using `providedIn: 'root'`. Read [creating-services.md](references/creating-services.md)
- **Defining Providers**: `InjectionToken`, `useClass`, `useValue`, `useFactory`, and scoping. Read [defining-providers.md](references/defining-providers.md)
- **Injection Context**: where `inject()` is allowed and how to work with context boundaries. Read [injection-context.md](references/injection-context.md)
- **Hierarchical Injectors**: `EnvironmentInjector`, `ElementInjector`, and provider resolution rules. Read [hierarchical-injectors.md](references/hierarchical-injectors.md)

## Routing

When implementing navigation, consult the following references:

- **Define Routes**: URL paths, static vs dynamic segments, wildcards, and redirects. Read [define-routes.md](references/define-routes.md)
- **Route Loading Strategies**: eager vs lazy loading. Read [loading-strategies.md](references/loading-strategies.md)
- **Show Routes with Outlets**: nested and named outlets. Read [show-routes-with-outlets.md](references/show-routes-with-outlets.md)
- **Navigate to Routes**: `RouterLink` and programmatic navigation. Read [navigate-to-routes.md](references/navigate-to-routes.md)
- **Control Route Access with Guards**: `CanActivate`, `CanMatch`, and other guard patterns. Read [route-guards.md](references/route-guards.md)
- **Data Resolvers**: `ResolveFn` and pre-fetching. Read [data-resolvers.md](references/data-resolvers.md)
- **Router Lifecycle and Events**: navigation events and debugging. Read [router-lifecycle.md](references/router-lifecycle.md)
- **Route Transition Animations**: View Transitions integration. Read [route-animations.md](references/route-animations.md)

If you need deeper routing guidance not covered locally, use the official Angular routing guide at `https://angular.dev/guide/routing`.

## Styling and Animations

When implementing styling or motion, consult:

- **Styling Components**: component styles, encapsulation, and local CSS decisions. Read [component-styling.md](references/component-styling.md)
- **Angular Animations**: use modern CSS first and the Angular animation tools when needed. Read [angular-animations.md](references/angular-animations.md)

If Tailwind, design systems, or advanced rendering strategies are part of the task, inspect the workspace first and fall back to official documentation where local references are missing.

## Testing

When writing or updating tests, consult the following references:

- **Fundamentals**: repository-specific testing guidance for Vitest and browser-mode tests. Read [testing-fundamentals.md](references/testing-fundamentals.md)
- **Component Harnesses**: patterns for robust component interaction. Read [component-harnesses.md](references/component-harnesses.md)
- **Router Testing**: `RouterTestingHarness` guidance. Read [router-testing.md](references/router-testing.md)
- **End-to-End (E2E) Testing**: Playwright guidance. Read [e2e-testing.md](references/e2e-testing.md)

In this repository, prefer the zoneless and async-first patterns already documented in the testing references. Do not rely on legacy `fixture.detectChanges()` flows when `await fixture.whenStable()` is the intended pattern.

## Accessibility

When the task involves accessibility, keep the work inside this Angular skill and read [accessibility-best-practices.md](references/accessibility-best-practices.md).

- Start from the current template, interaction model, styles, and tests before proposing changes.
- Prefer semantic HTML, keyboard support, accessible naming, and correct focus behavior before adding ARIA.
- For suggestion-only requests, explain why the recommendation matters and avoid editing code unless the user asks for implementation.
- For implementation requests, make the smallest coherent change and validate it with the narrowest relevant check.

## Tooling

When Angular tooling or agent workflows are part of the task:

- Use the Angular MCP tools when available to inspect the workspace, fetch documentation, and retrieve best-practice examples.
- Read [mcp.md](references/mcp.md)
- Use project scripts and the workspace package manager rather than assuming globally installed tooling.
