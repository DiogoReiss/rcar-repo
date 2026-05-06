/**
 * A14: TransformInterceptor removed — all API responses are returned as raw objects.
 * The paginated endpoints (customers, fleet, rental, inventory, wash) return
 * `{ data, total, page, perPage, totalPages }` by convention. Non-paginated
 * endpoints return the entity directly. Do NOT wrap in a `{ data: ... }` envelope
 * as the frontend is typed to the raw shapes.
 */
export {};

