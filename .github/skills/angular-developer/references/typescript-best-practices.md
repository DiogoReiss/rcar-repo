# TypeScript Best Practices

Create modern and scalable Angular web applications. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use generics for safe reuse
- Avoid overly complex or hard-to-read generics
- Write functions with a single responsibility and clear types
- Avoid ambiguous optional parameters in functions
- Prefer typed objects over long lists of arguments in functions
- Define explicit return types for public functions
- Create reusable types and avoid duplication
- Use `interface` by default to represent data structures — it is the standard choice for objects that define the shape of the system
- Use `type` only when interface is not sufficient — namely for unions, intersections, derived types, or any advanced composition
