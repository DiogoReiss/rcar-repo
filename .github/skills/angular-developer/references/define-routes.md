# Define Routes

Routes are objects that define which component should render for a specific URL path.

## Basic Configuration

Define routes in a `Routes` array and provide them using `provideRouter` in your `appConfig`.

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'admin', component: AdminPage },
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

## Lazy Route Imports

When using `loadChildren`, the import shape depends on how the target routes file is exported.

- **Preferred**: Use `export default` for lazy route files so `loadChildren` can return the dynamic import directly.
- **Alternative**: If the file uses a named export, use `.then(...)` to return the exported routes value.

```ts
// settings.routes.ts
export default [
  { path: '', component: SettingsPage },
] as Routes;

// app.routes.ts
{
  path: 'settings',
  loadChildren: () => import('./settings/settings.routes'),
}
```

Prefer the default-export pattern for lazily loaded route definition files. It keeps the loader shorter and avoids the extra `.then(...)` mapping.

```ts
// settings.routes.ts
export const settingsRoutes: Routes = [
  { path: '', component: SettingsPage },
];

// app.routes.ts
{
  path: 'settings',
  loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes),
}
```

## URL Paths

- **Static**: Matches an exact string (e.g., `'admin'`).
- **Route Parameters**: Dynamic segments prefixed with a colon (e.g., `'user/:id'`).
- **Wildcard**: Matches any URL using `**`. Useful for "Not Found" pages. **Always place at the end of the array.**

## Matching Strategy

Angular uses a **first-match wins** strategy. Specific routes must come before less specific ones.

## Redirects

Use `redirectTo` to point one path to another.

```ts
{ path: 'articles', redirectTo: '/blog' },
{ path: 'blog', component: Blog },
```

## Page Titles

Associate titles with routes for accessibility. Titles can be static or dynamic (via `ResolveFn` or a custom `TitleStrategy`).

```ts
{ path: 'home', component: Home, title: 'Home Page' }
```

## Route Data and Providers

- **Static Data**: Attach metadata using the `data` property.
- **Route Providers**: Scope dependencies to a specific route and its children using the `providers` array.

## Nested (Child) Routes

Define sub-views using the `children` property. Parent components must include a `<router-outlet />`.

```ts
{
  path: 'product/:id',
  component: Product,
  children: [
    { path: 'info', component: ProductInfo },
    { path: 'reviews', component: ProductReviews },
  ],
}
```
