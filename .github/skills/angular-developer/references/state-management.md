# State Management

This repository uses **NgRx Signal Store Events** for shared state. The pattern combines Signal Store features with an event-driven workflow:

1. Define **intent** in `*-events.ts`
2. Implement **pure state transitions** in `*-reducers.ts`
3. Keep **derived state** in `*-selectors.ts`
4. Handle **side effects** in `*-effects.ts`
5. Compose everything in `*-store.ts`
6. Let components **read from the store and dispatch events**, instead of mutating shared state directly

This keeps components thin, makes state transitions predictable, and prevents HTTP, routing, timers, and logging from leaking into reducers.

## Core Rules

- Use `eventGroup(...)` to model user or system intent.
- Reducers must be pure and immutable.
- Effects must handle all external interactions: HTTP, router, storage, analytics, timers, logging.
- Reusable derived state belongs in selectors via `withComputed()`.
- Keep each concern in its own file once a store does more than trivial local toggling.
- Components should call `injectDispatch(...)` and never write to shared state signals directly.

## Recommended File Structure

```text
feature/
├─ my-feature.events.ts
├─ my-feature.reducers.ts
├─ my-feature.selectors.ts
├─ my-feature.effects.ts
└─ my-feature.store.ts
```

## Example: Event Definition

Events describe what happened, not how state should be updated.

```ts
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const source = 'Main events';

export const mainEvents = eventGroup({
  source,
  events: {
    switch: type<void>(),
  },
});
```

Guidance:

- Name events after domain intent.
- Keep payloads typed with `type<...>()`.
- Avoid putting reducer logic into event names.

## Example: Reducers

Reducers receive events and return the next state. They must stay pure.

```ts
import { withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStoreFeature, type } from '@ngrx/signals';
import { on } from '@ngrx/signals/events';

import { mainEvents } from './main-events';

export interface MainState {
  opened: boolean;
}

export const MAIN_INITIAL_STATE: MainState = {
  opened: false,
};

export const withMainReducers = signalStoreFeature(
  {
    state: type<MainState>(),
  },
  withTrackedReducer(
    on(mainEvents.switch, (_, state) => ({
      opened: !state.opened,
    })),
  ),
);
```

Reducer rules:

- Do not call services, router APIs, `console.log`, or `localStorage` here.
- Always return a new state object.
- Keep branching logic readable; split complex transitions if needed.

## Example: Selectors

Selectors derive values from state and keep repeated transformation logic out of components.

```ts
import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';

import { MainState } from './main-reducers';

export const withMainSelectors = signalStoreFeature(
  {
    state: type<MainState>(),
  },
  withComputed(({ opened }) => ({
    stringifyIt: computed(() => (opened() ? 'It is opened' : 'It is closed')),
  })),
);
```

Selector guidance:

- Use selectors for reusable computed values.
- Keep selectors synchronous and side-effect free.
- Prefer expressive names that map to UI or domain language.

## Example: Effects

Effects subscribe to events and interact with the outside world.

```ts
import { inject } from '@angular/core';
import { signalStoreFeature, type } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { delay, tap } from 'rxjs';

import { mainEvents } from './main-events';
import { MainState } from './main-reducers';

export const withMainEffects = signalStoreFeature(
  {
    state: type<MainState>(),
  },
  withEventHandlers(({ opened }, events = inject(Events)) => ({
    sideEffect$: events.on(mainEvents.switch).pipe(
      delay(2000),
      tap(() => console.log('LOG effect:', opened())),
    ),
  })),
);
```

Effect rules:

- Put timers, logging, analytics, storage, router calls, and HTTP here.
- Listen to events with `events.on(...)`.
- Keep reducers free of asynchronous work.
- Prefer `Events` when a handler should emit follow-up events such as success or failure.
- Use `ReducerEvents` deliberately when reacting to the reducer event stream itself, as in simple logging or tracing scenarios.
- If an effect grows large, extract helper services instead of turning the store file into an orchestration blob.

## Example: Async Request Workflow

For real data loading, model the full lifecycle explicitly instead of hiding request state inside the effect.

### Events

```ts
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export interface User {
  id: string;
  name: string;
}

export const source = 'Users';

export const usersEvents = eventGroup({
  source,
  events: {
    loadRequested: type<void>(),
    loadSucceeded: type<User[]>(),
    loadFailed: type<string>(),
  },
});
```

### Reducers

```ts
import { withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStoreFeature, type } from '@ngrx/signals';
import { on } from '@ngrx/signals/events';

import { usersEvents, type User } from './users-events';

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const USERS_INITIAL_STATE: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const withUsersReducers = signalStoreFeature(
  {
    state: type<UsersState>(),
  },
  withTrackedReducer(
    on(usersEvents.loadRequested, () => ({
      loading: true,
      error: null,
    })),
    on(usersEvents.loadSucceeded, ({ payload }) => ({
      users: payload,
      loading: false,
      error: null,
    })),
    on(usersEvents.loadFailed, ({ payload }) => ({
      loading: false,
      error: payload,
    })),
  ),
);
```

### Selectors

```ts
import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';

import { UsersState } from './users-reducers';

export const withUsersSelectors = signalStoreFeature(
  {
    state: type<UsersState>(),
  },
  withComputed(({ users, loading, error }) => ({
    hasUsers: computed(() => users().length > 0),
    isEmpty: computed(() => !loading() && !error() && users().length === 0),
  })),
);
```

### Effects

```ts
import { inject } from '@angular/core';
import { signalStoreFeature, type } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { exhaustMap } from 'rxjs';

import { UsersApi } from './users-api';
import { usersEvents } from './users-events';
import { UsersState } from './users-reducers';

export const withUsersEffects = signalStoreFeature(
  {
    state: type<UsersState>(),
  },
  withEventHandlers((_, events = inject(Events), usersApi = inject(UsersApi)) => ({
    loadUsers$: events.on(usersEvents.loadRequested).pipe(
      exhaustMap(() =>
        usersApi.getAll().pipe(
          mapResponse({
            next: (users) => usersEvents.loadSucceeded(users),
            error: (error: { message?: string }) =>
              usersEvents.loadFailed(error.message ?? 'Failed to load users'),
          }),
        ),
      ),
    ),
  })),
);
```

Why this works:

- the component dispatches a single `loadRequested` intent
- reducers synchronously move state to `loading: true`
- the effect performs the HTTP request
- the effect emits either `loadSucceeded` or `loadFailed`
- those events are dispatched automatically by `withEventHandlers(...)`
- reducers bring the store back to a stable success or error state

### Store Composition

```ts
import { withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import env from '@app/environments/environment';
import { signalStore, withState } from '@ngrx/signals';

import { withUsersEffects } from './users-effects';
import { source } from './users-events';
import { USERS_INITIAL_STATE, UsersState, withUsersReducers } from './users-reducers';
import { withUsersSelectors } from './users-selectors';

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState<UsersState>(USERS_INITIAL_STATE),
  env.storeWithDevTools(source, withGlitchTracking()),
  withUsersSelectors,
  withUsersReducers,
  withUsersEffects,
);
```

### Component Usage

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';

import { UsersStore } from './users.store';
import { usersEvents } from './users-events';

@Component({
  selector: 'lync-users-page',
  templateUrl: './users-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPage {
  protected readonly store = inject(UsersStore);
  protected readonly dispatch = injectDispatch(usersEvents);

  protected loadUsers(): void {
    this.dispatch.loadRequested();
  }
}
```

```html
<button (click)="loadUsers()">Load users</button>

@if (store.loading()) {
<p>Loading...</p>
} @if (store.error()) {
<p>{{ store.error() }}</p>
} @if (store.hasUsers()) {
<ul>
  @for (user of store.users(); track user.id) {
  <li>{{ user.name }}</li>
  }
</ul>
}
```

This is the default shape to prefer for API-backed features: one request event in, one success or failure event out, and all loading and error state handled in reducers.

## Example: Store Composition

Compose state, selectors, reducers, and effects in one store file.

```ts
import { withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import env from '@app/environments/environment';
import { signalStore, withState } from '@ngrx/signals';

import { withMainEffects } from './main-effects';
import { source } from './main-events';
import { MAIN_INITIAL_STATE, MainState, withMainReducers } from './main-reducers';
import { withMainSelectors } from './main-selectors';

export const MainStore = signalStore(
  { providedIn: 'root' },
  withState<MainState>(MAIN_INITIAL_STATE),
  env.storeWithDevTools(source, withGlitchTracking()),
  withMainSelectors,
  withMainReducers,
  withMainEffects,
);
```

Composition guidance:

- Keep the store file declarative.
- Add devtools and debugging helpers here, not in reducers or components.
- Use `providedIn: 'root'` for truly shared application state.

## Example: Component Usage

Components should inject the store for reads and inject a dispatcher for writes.

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DsButtonModule } from '@bmw-ds/components';
import { injectDispatch } from '@ngrx/signals/events';

import { mainEvents } from '../../core/store/main-events';
import { MainStore } from '../../core/store/main-store';

@Component({
  selector: 'lync-feat-dashboard',
  templateUrl: 'dashboard.html',
  imports: [DsButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard {
  protected readonly store = inject(MainStore);
  protected readonly dispatch = injectDispatch(mainEvents);
}
```

```html
<button ds-button (click)="dispatch.switch()">Switch</button>
```

Component rules:

- Read shared state from the store.
- Dispatch events from the UI.
- Do not mutate shared state inside the component.
- Keep view-only local state in component signals when it does not need to be shared.

## When To Use This Pattern

Prefer this pattern when:

- state is shared across multiple components or routes
- actions trigger side effects
- you want a predictable event history
- you need computed state reused in several places

Prefer plain component signals when state is local to one component subtree and there is no benefit in lifting it to a shared store.

## Anti-Patterns

- Calling services or router APIs inside reducers
- Writing to shared signals directly from components
- Duplicating derived values in multiple components instead of using selectors
- Keeping all events, reducers, effects, and selectors in one large file after the feature grows
- Using the store for ephemeral UI state that never leaves a single component
