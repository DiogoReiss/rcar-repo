/**
 * Multi-unit segmentation helper. GESTOR_GERAL sees every operational unit;
 * all other roles are scoped to their own `unidadeId`. Returns a Prisma
 * where-fragment to merge into queries on unit-segmented models.
 */

export interface UnitScopedUser {
  role?: string;
  unidadeId?: string | null;
}

export function isGlobalScope(user: UnitScopedUser | undefined): boolean {
  return user?.role === 'GESTOR_GERAL';
}

/** where-fragment restricting rows to the user's unit (empty = unrestricted). */
export function unitScopeWhere(user: UnitScopedUser | undefined): {
  unidadeId?: string;
} {
  if (isGlobalScope(user)) return {};
  if (!user?.unidadeId) return {};
  return { unidadeId: user.unidadeId };
}

/**
 * Whether a user may act on a resource belonging to `resourceUnitId`.
 * Global-scope users may act on anything; scoped users only within their unit.
 * Unassigned resources (null unit) are treated as accessible during the
 * segmentation base phase.
 */
export function canAccessUnit(
  user: UnitScopedUser | undefined,
  resourceUnitId: string | null | undefined,
): boolean {
  if (isGlobalScope(user)) return true;
  if (!resourceUnitId) return true;
  return !!user?.unidadeId && user.unidadeId === resourceUnitId;
}
