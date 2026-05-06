# RCar — Arquitetura Frontend (Angular 21)

## Stack

| Tecnologia         | Versão / Detalhes                        |
|--------------------|------------------------------------------|
| Framework          | Angular 21 (standalone APIs)             |
| State Management   | Component Signals (prioridade) + NgRx Signal Store Events (estado compartilhado) |
| Design System      | PrimeNG + Angular Material                |
| Estilização        | SCSS                                     |
| Build              | @angular/build:application               |
| Package Manager    | pnpm                                     |
| Testes unitários   | Vitest via Analog                        |
| Testes browser     | Vitest browser mode                      |
| Testes E2E         | Playwright                               |
| Selector prefix    | `lync`                                   |

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts            # Verifica se usuário está autenticado
│   │   │   │   └── role.guard.ts            # Verifica perfil (gestor_geral, operador, cliente)
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts      # Injeta JWT no header
│   │   │   │   └── refresh-token.interceptor.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts          # Login, logout, refresh, user info
│   │   │   └── models/
│   │   │       └── user.model.ts
│   │   ├── store/
│   │   │   ├── app-events.ts
│   │   │   ├── app-reducers.ts
│   │   │   ├── app-selectors.ts
│   │   │   ├── app-effects.ts
│   │   │   └── app-store.ts
│   │   └── layout/
│   │       ├── shell/                       # Layout principal (sidebar + header + content)
│   │       ├── header/
│   │       └── sidebar/
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── data-table/                  # Tabela genérica com paginação e filtros
│   │   │   ├── confirm-dialog/
│   │   │   ├── file-upload/
│   │   │   ├── pdf-viewer/
│   │   │   └── status-badge/
│   │   ├── pipes/
│   │   │   ├── currency-brl.pipe.ts
│   │   │   └── date-br.pipe.ts
│   │   ├── directives/
│   │   │   └── has-role.directive.ts        # *hasRole="'gestor_geral'" para mostrar/esconder
│   │   └── models/
│   │       ├── pagination.model.ts
│   │       └── api-response.model.ts
│   │
│   ├── admin/                               # Lazy-loaded feature
│   │   ├── admin.routes.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard.ts
│   │   │   ├── dashboard.html
│   │   │   ├── dashboard.scss
│   │   │   └── dashboard.spec.ts
│   │   ├── usuarios/
│   │   │   ├── usuarios-list/
│   │   │   ├── usuario-form/
│   │   │   └── store/
│   │   │       ├── usuarios-events.ts
│   │   │       ├── usuarios-reducers.ts
│   │   │       ├── usuarios-selectors.ts
│   │   │       ├── usuarios-effects.ts
│   │   │       └── usuarios-store.ts
│   │   ├── servicos/
│   │   │   ├── servicos-list/
│   │   │   └── servico-form/
│   │   ├── estoque/
│   │   │   ├── produtos-list/
│   │   │   ├── produto-form/
│   │   │   └── movimentacoes/
│   │   ├── frota/
│   │   │   ├── frota-list/
│   │   │   ├── veiculo-form/
│   │   │   └── veiculo-detail/
│   │   ├── clientes/
│   │   │   ├── clientes-list/
│   │   │   └── cliente-form/
│   │   ├── templates/
│   │   │   ├── templates-list/
│   │   │   ├── template-editor/
│   │   │   └── template-preview/
│   │   └── relatorios/
│   │       ├── relatorio-financeiro/
│   │       └── relatorio-ocupacao/
│   │
│   ├── lavajato/                            # Lazy-loaded feature
│   │   ├── lavajato.routes.ts
│   │   ├── agendamento/
│   │   │   ├── calendario/
│   │   │   ├── agendamento-form/
│   │   │   └── agendamento-confirmacao/
│   │   ├── fila/
│   │   │   ├── fila-painel/                 # Painel em tempo real
│   │   │   └── fila-adicionar/
│   │   ├── atendimentos/
│   │   │   ├── atendimentos-dia/
│   │   │   └── atendimento-detail/
│   │   └── store/
│   │       ├── lavajato-events.ts
│   │       ├── lavajato-reducers.ts
│   │       ├── lavajato-selectors.ts
│   │       ├── lavajato-effects.ts
│   │       └── lavajato-store.ts
│   │
│   ├── aluguel/                             # Lazy-loaded feature
│   │   ├── aluguel.routes.ts
│   │   ├── reserva/
│   │   │   ├── disponibilidade/
│   │   │   ├── reserva-form/
│   │   │   └── reserva-confirmacao/
│   │   ├── contratos/
│   │   │   ├── contrato-list/
│   │   │   ├── contrato-abertura/
│   │   │   │   ├── vistoria-saida/
│   │   │   │   └── assinatura/
│   │   │   └── contrato-detail/
│   │   ├── devolucao/
│   │   │   ├── vistoria-chegada/
│   │   │   └── fechamento/
│   │   └── store/
│   │       ├── aluguel-events.ts
│   │       ├── aluguel-reducers.ts
│   │       ├── aluguel-selectors.ts
│   │       ├── aluguel-effects.ts
│   │       └── aluguel-store.ts
│   │
│   └── portal-cliente/                      # Lazy-loaded feature (visão do cliente)
│       ├── portal.routes.ts
│       ├── meus-agendamentos/
│       ├── minhas-reservas/
│       ├── meus-documentos/
│       └── historico/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
├── test-setup.unit.ts
└── main.ts
```

---

## Roteamento

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['gestor_geral', 'operador'])],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'lavajato',
    canActivate: [authGuard, roleGuard(['gestor_geral', 'operador'])],
    loadChildren: () => import('./lavajato/lavajato.routes').then(m => m.LAVAJATO_ROUTES)
  },
  {
    path: 'aluguel',
    canActivate: [authGuard, roleGuard(['gestor_geral', 'operador'])],
    loadChildren: () => import('./aluguel/aluguel.routes').then(m => m.ALUGUEL_ROUTES)
  },
  {
    path: 'portal',
    canActivate: [authGuard],
    loadChildren: () => import('./portal-cliente/portal.routes').then(m => m.PORTAL_ROUTES)
  }
];
```

---

## State Management

### Prioridade: Component Signals

O estado local e derivado deve ser gerenciado **prioritariamente com signals nativos do Angular** dentro dos próprios componentes e services. Use Signal Store Events **apenas** para estado verdadeiramente compartilhado entre múltiplos componentes/features.

#### Quando usar Component Signals (padrão)

- Estado local do componente (formulários, toggles, loading, listas filtradas)
- Estado derivado (`computed()`) de inputs ou estado local
- Comunicação pai → filho via `input()` / `output()`
- Services com `signal()` para estado de feature scope (ex: `ServicosService` com lista em memória)

```typescript
// Exemplo: estado local com signals — SEM store
@Component({ ... })
export default class ServicosListComponent {
  private readonly servicosService = inject(ServicosService);

  readonly servicos = this.servicosService.servicos;        // signal
  readonly loading = this.servicosService.loading;          // signal
  readonly filtro = signal('');
  readonly servicosFiltrados = computed(() =>
    this.servicos().filter(s => s.nome.toLowerCase().includes(this.filtro().toLowerCase()))
  );

  onFiltrar(termo: string) {
    this.filtro.set(termo);
  }
}
```

```typescript
// Service com signals (estado de feature)
@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiService);

  readonly servicos = signal<Servico[]>([]);
  readonly loading = signal(false);

  async carregarServicos() {
    this.loading.set(true);
    const res = await firstValueFrom(this.api.get<Servico[]>('/wash/services'));
    this.servicos.set(res.data);
    this.loading.set(false);
  }
}
```

#### Quando usar NgRx Signal Store Events (exceção)

- Estado global que **múltiplas features** precisam reagir (ex: usuário logado, notificações globais)
- Fluxos complexos de orquestração com múltiplos side effects encadeados
- Quando precisar de replay/debug de eventos para rastrear bugs

Cada feature que **realmente precisar** de store segue o padrão split-by-concern:

```typescript
// src/app/lavajato/store/lavajato-events.ts
import { eventGroup } from '@ngrx/signals/events';

export const LavajatoEvents = eventGroup({
  source: 'Lavajato',
  events: {
    agendamentosCarregados: props<{ agendamentos: Agendamento[] }>(),
    agendamentoCriado: props<{ agendamento: Agendamento }>(),
    filAtualizada: props<{ fila: FilaItem[] }>(),
    statusAlterado: props<{ id: string; status: string }>(),
  }
});
```

### Princípios

- **Priorize signals nativos** → `signal()`, `computed()`, `effect()` em componentes e services
- **Signal Store Events somente para estado verdadeiramente global** (auth, notificações, config)
- **Components** → gerenciam estado local com signals; disparam métodos de services
- **Services** → encapsulam chamadas HTTP e expõem signals com o estado da feature
- **Store (quando necessário)** → disparam eventos, leem selectors, coordenam side effects complexos

---

## Componentes — Convenções

```typescript
// Exemplo: src/app/admin/servicos/servicos-list/servicos-list.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ServicosStore } from '../store/servicos-store';

@Component({
  selector: 'rcar-servicos-list',
  templateUrl: './servicos-list.html',
  styleUrl: './servicos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ServicosListComponent {
  private readonly store = inject(ServicosStore);

  readonly servicos = this.store.servicos;
  readonly loading = this.store.loading;
}
```

### Regras

- `export default class` para arquivos com um único componente
- `inject()` ao invés de constructor injection
- `input()` / `output()` para APIs de componentes
- Signals para estado local
- Template com `@if`, `@for`, `@switch`
- `ChangeDetectionStrategy.OnPush` padrão
- Host bindings em `host: {}` no decorator

---

## Comunicação com Backend

```typescript
// src/app/core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private baseUrl = this.env.apiUrl;

  get<T>(path: string, params?: HttpParams) {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  // put, patch, delete...
}
```

- Interceptor adiciona `Authorization: Bearer <token>` automaticamente
- Interceptor de refresh renova token expirado transparentemente
- Respostas seguem formato padrão: `{ data: T, meta?: PaginationMeta }`

---

## Testes

| Tipo             | Arquivo                    | Comando           |
|------------------|----------------------------|-------------------|
| Unitário         | `*.spec.ts`                | `pnpm test:unit`  |
| Browser (Vitest) | `*.browser.spec.ts`        | `pnpm test:browser` |
| E2E (Playwright) | `e2e/*.spec.ts`            | `pnpm test:e2e`   |

### Exemplo de teste unitário

```typescript
// src/app/admin/servicos/servicos-list/servicos-list.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import ServicosListComponent from './servicos-list';

describe('ServicosListComponent', () => {
  it('deve exibir lista de serviços', async () => {
    await render(ServicosListComponent, {
      providers: [/* mock store */]
    });
    expect(screen.getByText('Lavagem Simples')).toBeTruthy();
  });
});
```

---

## Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@admin/*": ["src/app/admin/*"],
    "@lavajato/*": ["src/app/lavajato/*"],
    "@aluguel/*": ["src/app/aluguel/*"],
    "@portal/*": ["src/app/portal-cliente/*"],
    "@core/*": ["src/app/core/*"],
    "@shared/*": ["src/app/shared/*"],
    "@env/*": ["src/environments/*"]
  }
}
```

---

## Responsividade e UX

- Layout principal: sidebar colapsável + header + área de conteúdo
- Mobile-first para portal do cliente
- Desktop-first para Admin/Operador (uso interno)
- Feedback visual: loading skeletons, toasts para ações, confirmação para operações destrutivas

---

## Shared Types (`packages/shared-types`)

O pacote `@rcar/shared-types` é a **fonte única de verdade** para todos os tipos de domínio compartilhados entre o frontend e o backend.

```
packages/
└── shared-types/
    ├── package.json         # name: "@rcar/shared-types"
    └── src/
        └── index.ts         # Exporta todos os tipos: User, Customer, Vehicle, etc.
```

### Uso no frontend

```typescript
// Novo código importa diretamente:
import type { User, RentalContract, PaginatedResponse } from '@rcar/shared-types';

// Código existente continua funcionando via re-export:
import type { User } from '@shared/models/entities.model';
```

### Tipos exportados

| Categoria    | Tipos                                                                              |
|--------------|-----------------------------------------------------------------------------------|
| Enums        | `UserRole`, `CustomerType`, `VehicleStatus`, `ContractStatus`, `PaymentMethod`, … |
| Auth         | `User`, `AuthTokens`, `LoginCredentials`                                           |
| Entidades    | `Customer`, `Vehicle`, `WashService`, `Product`, `RentalContract`, `Template`, …  |
| Paginação    | `PaginatedResponse<T>` — wrapper para todas as listas paginadas                    |

### Convenção

- Nunca duplique tipos entre `apps/web` e `apps/api` — adicione em `packages/shared-types`.
- Ao alterar um modelo Prisma, atualize `shared-types` e regenere o cliente Prisma.

---

### Princípio

Manter os arquivos SCSS dos componentes o mais **limpos e enxutos** possível, centralizando valores reutilizáveis em **shared variables, mixins e funções**. Nenhum valor mágico (cor hex, tamanho em px, font-family literal) deve aparecer solto em um SCSS de componente.

### Estrutura de arquivos

```
src/styles/
├── _variables.scss      # Design tokens: cores, tipografia, espaçamentos, sombras, breakpoints, z-index, transições, layout
├── _mixins.scss          # Mixins reutilizáveis (responsividade, tipografia, cards, truncate, focus-ring, scrollbar)
├── _index.scss           # Barrel — @forward de variables e mixins para consumo via @use
└── styles.scss           # Estilos globais (reset, body, utilitários genéricos)
```

### Variáveis obrigatórias (`_variables.scss`)

| Categoria       | Exemplos de tokens                                                                 |
|-----------------|------------------------------------------------------------------------------------|
| **Cores brand** | `$color-primary`, `$color-primary-light`, `$color-secondary`, `$color-accent`      |
| **Neutros**     | `$color-gray-50` … `$color-gray-900`, `$color-white`, `$color-black`              |
| **Semânticas**  | `$color-success`, `$color-warning`, `$color-error`, `$color-info`                  |
| **Backgrounds** | `$bg-body`, `$bg-card`, `$bg-sidebar`, `$bg-header`                               |
| **Texto**       | `$text-primary`, `$text-secondary`, `$text-disabled`, `$text-inverse`              |
| **Tipografia**  | `$font-family-base`, `$font-size-xs` … `$font-size-4xl`, `$font-weight-regular` … `$font-weight-bold`, `$line-height-*` |
| **Espaçamento** | `$spacing-1` (4px) … `$spacing-16` (64px)                                         |
| **Raio**        | `$radius-sm`, `$radius-md`, `$radius-lg`, `$radius-full`                          |
| **Sombras**     | `$shadow-sm`, `$shadow-md`, `$shadow-lg`, `$shadow-xl`                            |
| **Breakpoints** | `$breakpoint-sm` (576px), `$breakpoint-md` (768px), `$breakpoint-lg`, `$breakpoint-xl`, `$breakpoint-2xl` |
| **Z-index**     | `$z-dropdown`, `$z-sidebar`, `$z-header`, `$z-overlay`, `$z-modal`, `$z-toast`    |
| **Transições**  | `$transition-fast` (150ms), `$transition-base` (250ms), `$transition-slow` (400ms) |
| **Layout**      | `$sidebar-width`, `$sidebar-width-collapsed`, `$header-height`, `$content-max-width` |

### Mixins obrigatórios (`_mixins.scss`)

| Mixin               | Uso                                                       |
|----------------------|-----------------------------------------------------------|
| `respond-to($bp)`   | Media queries por breakpoint (`sm`, `md`, `lg`, `xl`)     |
| `text($size, $weight, $color)` | Atalho para definir tipografia                 |
| `heading($size)`     | Título com peso e line-height padrão                      |
| `flex-center`        | `display: flex` centralizado                              |
| `flex-between`       | `display: flex` com `space-between`                       |
| `card($padding)`     | Background, radius e shadow padrão de card                |
| `truncate($lines)`   | Truncar texto com ellipsis (1 linha ou multi-linha)       |
| `focus-ring($color)` | Outline acessível para foco (WCAG AA)                     |
| `custom-scrollbar`   | Scrollbar estilizada e discreta                           |

### Como consumir nos componentes

Configurar `stylePreprocessorOptions` no `angular.json` para que `src/styles/` esteja no include path:

```json
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```

Nos arquivos SCSS de componentes, importar apenas o necessário:

```scss
// servicos-list.scss
@use 'variables' as *;
@use 'mixins' as *;

:host {
  display: block;
  padding: $spacing-6;
}

.servicos-header {
  @include flex-between;
  margin-bottom: $spacing-4;
}

.servicos-card {
  @include card;
}

.servico-nome {
  @include text($font-size-lg, $font-weight-medium);
  @include truncate;
}
```

### Regras

- **Nunca** usar valores hardcoded (ex: `color: #1a73e8`, `padding: 16px`, `font-family: 'Inter'`) — sempre referenciar uma variável.
- **Nunca** duplicar mixins ou variáveis localmente — se um token não existe, adicioná-lo em `_variables.scss`.
- **Sempre** usar `@use` (não `@import`) para consumir os partials.
- **Preferir** mixins para padrões repetitivos ao invés de copiar blocos de CSS entre componentes.
- **Manter** os arquivos de componentes curtos: se um SCSS de componente ultrapassar ~80 linhas, avaliar se há lógica que deveria ser um mixin ou utilitário compartilhado.

