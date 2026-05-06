import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';

/**
 * Structural directive that shows/hides content based on the current user's role.
 *
 * Usage:
 *   <button *lyncHasRole="'GESTOR_GERAL'">Admin only</button>
 *   <div *lyncHasRole="['GESTOR_GERAL', 'OPERADOR']">Staff only</div>
 */
@Directive({ selector: '[lyncHasRole]' })
export default class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef);
  private readonly vcr = inject(ViewContainerRef);
  private visible = false;

  readonly lyncHasRole = input<string | string[]>('');

  constructor() {
    effect(() => {
      const roles = this.lyncHasRole();
      const user = this.auth.currentUser();
      const required = Array.isArray(roles) ? roles : [roles];
      const allowed = !!user && (required.length === 0 || required.includes(user.role));

      if (allowed && !this.visible) {
        this.vcr.createEmbeddedView(this.templateRef);
        this.visible = true;
      } else if (!allowed && this.visible) {
        this.vcr.clear();
        this.visible = false;
      }
    });
  }
}

