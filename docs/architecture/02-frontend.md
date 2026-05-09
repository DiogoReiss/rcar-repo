# RCar — Arquitetura Frontend (Angular 21)

## Stack

| Tecnologia         | Versão / Detalhes                        |
|--------------------|------------------------------------------|
| Framework          | Angular 21 (standalone APIs)             |
| State Management   | Component Signals (prioridade) + NgRx Signal Store Events (estado compartilhado) |
| Ícones             | PrimeIcons 7 (`pi` prefix)               |
| Design System      | PrimeNG 21                               |
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
│   │       ├── shell/                       # Layout principal (sidebar + header + router-outlet)
│   │       ├── header/                      # Barra superior: brand, avatar, notificações, logout
│   │       └── sidebar/                     # Menu lateral colapsável com seções e tooltips
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── confirm-dialog/              # Dialog de confirmação acessível (já existente)
│   │   │   ├── page-header/                 # <lync-page-header title="..."> + ng-content para ações
│   │   │   └── pagination/                  # <lync-pagination> com page/totalPages/total/pageChange
│   │   ├── pipes/
│   │   │   ├── currency-brl.pipe.ts
│   │   │   └── date-br.pipe.ts
│   │   ├── directives/
│   │   │   └── has-role.directive.ts        # *hasRole="'gestor_geral'" para mostrar/esconder
│   │   └── models/
│   │       ├── entities.model.ts
│   │       └── api-response.model.ts
│   │
│   ├── admin/                               # Lazy-loaded feature
│   │   ├── admin.routes.ts
│   │   ├── dashboard/
│   │   ├── usuarios/
│   │   ├── servicos/
│   │   ├── estoque/
│   │   │   ├── produtos-list/
│   │   │   ├── produto-form/
│   │   │   └── movimentacoes/
│   │   ├── frota/
│   │   ├── clientes/
│   │   ├── templates/
│   │   └── financeiro/                    # DRE, contas a receber, rentabilidade
│   │       ├── financeiro-dashboard/
│   │       └── financeiro.service.ts
│   │
│   ├── lavajato/                            # Lazy-loaded feature
│   │   ├── lavajato.routes.ts
│   │   ├── agendamento/
│   │   │   └── calendario/
│   │   ├── fila/
│   │   │   └── fila-painel/                 # Painel em tempo real (WebSocket / polling)
│   │   └── atendimentos/
│   │       └── atendimentos-dia/
│   │
│   ├── aluguel/                             # Lazy-loaded feature
│   │   ├── aluguel.routes.ts
│   │   ├── reserva/
│   │   │   └── disponibilidade/
│   │   ├── contratos/
│   │   │   └── contrato-list/
│   │   └── devolucao/
│   │       └── vistoria-chegada/
│   │
│   └── portal-cliente/                      # Lazy-loaded feature (visão do cliente)
│       ├── portal.routes.ts
│       └── ...
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
├── styles/
│   ├── _variables.scss   # Design tokens
│   ├── _mixins.scss
│   ├── _index.scss       # Barrel
│   └── _admin.scss       # Utilitários globais da área admin (.page, .page-header, .btn-*, .badge, .data-table, …)
│
├── test-setup.unit.ts
└── main.ts
```

---

## Roteamento

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell/shell'),
    canActivate: [authGuard],
    children: [
      { path: 'admin',    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes) },
      { path: 'lavajato', loadChildren: () => import('./lavajato/lavajato.routes').then(m => m.lavajatoRoutes) },
      { path: 'aluguel',  loadChildren: () => import('./aluguel/aluguel.routes').then(m => m.aluguelRoutes) },
      { path: 'portal',   loadChildren: () => import('./portal-cliente/portal.routes').then(m => m.portalRoutes) },
      { path: '',         redirectTo: 'admin', pathMatch: 'full' },  // dashboard em /admin (path vazio)
    ],
  },
];
```

> **Nota:** O dashboard vive em `/admin` (empty-path em `admin.routes.ts`), **não** em `/admin/dashboard`. Links internos devem usar `routerLink="/admin"`.

### Auth (implementado)

- Rotas: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`
- Login expõe links diretos para cadastro (`/auth/register`) e retorno para landing (`/`)
- Fluxo de cadastro redireciona para `/auth/login` com prefill de `email` via query param

### Admin — Financeiro (implementado)

- Rota: `/admin/financeiro`
- Página: `src/app/admin/financeiro/financeiro-dashboard/`
- Service: `src/app/admin/financeiro/financeiro.service.ts`
- Fontes de dados consumidas:
  - `GET /reports/financial-summary`
  - `GET /reports/rental/receivables`
  - `GET /reports/fleet/maintenance-costs`
  - `GET /reports/stock/cost-analysis`
- Pendências para fechamento da feature:
  - gráfico doughnut de distribuição por método de pagamento
  - rentabilidade por veículo completa (receita - manutenção)
  - card de valoração total do estoque e export CSV/PDF

### Admin — Templates (playful editor)

- Rota: `/admin/templates`
- Página: `src/app/admin/templates/templates-list/`
- Fluxo de edição:
  - define variáveis do template no campo CSV (`clienteNome, valorTotal, ...`)
  - edita conteúdo em **rich editor** (toolbar de formatação: negrito, itálico, sublinhado e lista)
  - aplica blocos (`H1`, `H2`, `Parágrafo`) e inserção de link por painel no editor
  - usa **Playground de variáveis** com chips arrastáveis (`{{variavel}}`)
  - pode inserir por drag-and-drop no editor HTML ou por clique no chip (inserção no cursor)
  - tokens inseridos aparecem como chips inline não-editáveis no editor, mas persistem como Handlebars no HTML salvo
  - atalhos do editor: `Cmd/Ctrl+K` (link), `Cmd/Ctrl+Z` (desfazer), `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` (refazer)
  - renderiza preview com JSON customizável no painel lateral
- Mock mode (`pnpm --filter web dev:mock`) oferece ciclo completo para testes locais:
  - listagem, edição e persistência em memória
  - preview em `/templates/:id/preview` com interpolação das variáveis informadas

---

## Layout Shell

O shell principal está em `core/layout/` e é composto por três peças:

### `ShellComponent` (`shell/`)
- Envolve `<lync-header>` + `<lync-sidebar>` + `<router-outlet>`
- Gerencia sinal `sidebarCollapsed` e o propaga via `input()`

### `HeaderComponent` (`header/`)

| Elemento           | Detalhe                                                          |
|--------------------|------------------------------------------------------------------|
| Brand              | Ícone `pi-car` em badge laranja + nome "RCar" com gradiente       |
| Toggle sidebar     | `pi-bars` / `pi-times`; classes `.icon-btn`                      |
| Notificações       | Botão `pi-bell` (placeholder para expansão futura)               |
| Avatar             | Círculo com iniciais derivadas de `userInitials(user.nome)`       |
| Info do usuário    | Nome + papel (role label) — oculto em mobile                     |
| Logout             | `pi-sign-out` com hover danger; `.icon-btn--danger`              |

Todos os botões de ação usam a classe utilitária `.icon-btn` (definida em `header.scss`).

### `SidebarComponent` (`sidebar/`)

O menu lateral usa **PrimeIcons** e organiza os itens em **quatro seções**:

| Seção          | Itens                                              |
|----------------|----------------------------------------------------|
| Geral          | Dashboard, Clientes, Frota, Estoque                |
| Lavajato       | Serviços, Agendamentos, Fila                       |
| Aluguel        | Aluguéis (unificado: reservas + contratos)          |
| Financeiro     | DRE, Contas a Receber, Rentabilidade               |
| Administração  | Templates, Usuários                                |

- Títulos de seção são ocultados quando o sidebar está colapsado
- Usa `pTooltip` (PrimeNG) com `[tooltipDisabled]="!collapsed()"` para exibir o label no hover quando colapsado
- Ícones: `pi pi-home`, `pi pi-users`, `pi pi-car`, `pi pi-box`, `pi pi-wrench`, `pi pi-calendar`, `pi pi-list-check`, `pi pi-ticket`, `pi pi-file-edit`, `pi pi-copy`, `pi pi-user-edit`

---

## Componentes Compartilhados (`shared/components/`)

### `lync-page-header`

Encapsula o padrão `<header class="page-header"><h1>...</h1></header>` presente em todas as páginas da área admin/lavajato/aluguel.

```html
<!-- uso básico -->
<lync-page-header title="Usuários">
  <a class="btn-primary" routerLink="novo">+ Novo Usuário</a>
</lync-page-header>

<!-- título dinâmico -->
<lync-page-header [title]="isEdit() ? 'Editar Cliente' : 'Novo Cliente'">
  <a class="btn-secondary" routerLink="..">← Voltar</a>
</lync-page-header>

<!-- sem ação -->
<lync-page-header title="Templates de Documentos" />
```

API:
| Input     | Tipo     | Obrigatório | Descrição            |
|-----------|----------|-------------|----------------------|
| `title`   | `string` | ✅           | Texto do `<h1>`      |
| (ng-content) | —     | —           | Botões, filtros, etc. |

---

### `lync-pagination`

Componente de paginação reutilizável. Não renderiza nada quando `totalPages ≤ 1`.

```html
<lync-pagination
  [page]="page()"
  [totalPages]="totalPages()"
  [total]="total()"
  label="resultado(s)"
  (pageChange)="goToPage($event)"
/>
```

API:
| Input / Output | Tipo       | Padrão        | Descrição                       |
|----------------|------------|---------------|---------------------------------|
| `page`         | `number`   | obrigatório   | Página atual (1-based)          |
| `totalPages`   | `number`   | obrigatório   | Total de páginas                |
| `total`        | `number`   | `0`           | Total de itens (texto de rodapé)|
| `label`        | `string`   | `'itens'`     | Unidade exibida no rodapé       |
| `pageChange`   | `number`   | output        | Emite nova página ao clicar     |

---

### `lync-confirm-dialog`

Dialog modal acessível para confirmar operações destrutivas. Ver `shared/components/confirm-dialog/`.

---

## Padrão de Página Admin

Todas as páginas de listagem/formulário seguem esta estrutura:

```html
<section class="page">
  <lync-page-header title="Clientes">
    <a class="btn-primary" routerLink="novo">+ Novo</a>
  </lync-page-header>

  @if (loading()) {
    <div class="loading">Carregando...</div>
  } @else if (error()) {
    <div class="error">{{ error() }}</div>
  } @else {
    <div class="table-wrapper">
      <table class="data-table">
        ...
      </table>
    </div>

    <lync-pagination [page]="page()" [totalPages]="totalPages()" ... />
  }
</section>
```

As classes `.page`, `.loading`, `.error`, `.table-wrapper`, `.data-table`, `.badge`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.btn-danger`, `.form-card`, `.form-grid`, `.form-field`, `.search-bar` são **globais** definidas em `src/styles/_admin.scss` — não precisam ser redefinidas nos SCSS de componentes.

---

## State Management

### Prioridade: Component Signals

O estado local e derivado deve ser gerenciado **prioritariamente com signals nativos do Angular** dentro dos próprios componentes e services. Use Signal Store Events **apenas** para estado verdadeiramente compartilhado entre múltiplos componentes/features.

#### Quando usar Component Signals (padrão)

- Estado local do componente (formulários, toggles, loading, listas filtradas)
- Estado derivado (`computed()`) de inputs ou estado local
- Comunicação pai → filho via `input()` / `output()`
- Services com `signal()` para estado de feature scope

```typescript
@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiService);

  readonly servicos = signal<WashService[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load() {
    this.loading.set(true);
    return this.api.get<WashService[]>('/wash/services').pipe(
      tap(data => { this.servicos.set(data); this.loading.set(false); }),
      catchError(err => { this.error.set(err.message); this.loading.set(false); return EMPTY; }),
    );
  }
}
```

#### Quando usar NgRx Signal Store Events (exceção)

- Estado global que **múltiplas features** precisam reagir (ex: usuário logado, notificações globais)
- Fluxos complexos de orquestração com múltiplos side effects encadeados

---

## Componentes — Convenções

```typescript
// Exemplo: src/app/admin/servicos/servicos-list/servicos-list.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicosService } from '../servicos.service';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-servicos-list',
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './servicos-list.html',
  styleUrl: './servicos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ServicosListComponent {
  private readonly servicosService = inject(ServicosService);

  readonly servicos = this.servicosService.servicos;
  readonly loading  = this.servicosService.loading;
  readonly error    = this.servicosService.error;
}
```

### Regras

- `export default class` para arquivos com um único componente
- `inject()` ao invés de constructor injection
- `input()` / `output()` para APIs de componentes
- Signals para estado local e derivado
- Template com `@if`, `@for`, `@switch` (native control flow)
- `ChangeDetectionStrategy.OnPush` padrão
- Host bindings em `host: {}` no decorator — não usar `@HostBinding` / `@HostListener`
- Não declarar `standalone: true` (padrão no Angular 21)

### Pitfall: `@ViewChild` + signals + `@if`

Ao usar `@ViewChild` dentro de um bloco `@if` controlado por um signal, o ref só estará disponível **após** o próximo ciclo de renderização. Chame qualquer código que dependa do ref via `afterNextRender`:

```typescript
// ❌ ERRADO — crasha se o signal foi setado neste ciclo
this.chartsLoading.set(false);
if (this.viewReady) this.renderCharts(); // @ViewChild ainda undefined

// ✅ CORRETO
private readonly injector = inject(Injector);

this.chartsLoading.set(false);
if (this.viewReady) {
  afterNextRender(() => this.renderCharts(), { injector: this.injector });
}
```

---

## Comunicação com Backend

```typescript
// src/app/core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: HttpParams) { ... }
  post<T>(path: string, body: unknown)      { ... }
  put<T>(path: string, body: unknown)       { ... }
  patch<T>(path: string, body: unknown)     { ... }
  delete<T>(path: string)                   { ... }
}
```

- Interceptor adiciona `Authorization: Bearer <token>` automaticamente
- Interceptor de refresh renova token expirado transparentemente

---

## Testes

| Tipo             | Arquivo                    | Comando             |
|------------------|----------------------------|---------------------|
| Unitário         | `*.unit.spec.ts`           | `pnpm test:unit`    |
| Browser (Vitest) | `*.browser.spec.ts`        | `pnpm test:browser` |
| E2E (Playwright) | `e2e/*.spec.ts`            | `pnpm test:e2e`     |

---

## Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@core/*":    ["src/app/core/*"],
    "@shared/*":  ["src/app/shared/*"],
    "@admin/*":   ["src/app/admin/*"],
    "@lavajato/*":["src/app/lavajato/*"],
    "@aluguel/*": ["src/app/aluguel/*"],
    "@portal/*":  ["src/app/portal-cliente/*"],
    "@env/*":     ["src/environments/*"]
  }
}
```

---

## Responsividade e UX

- Layout principal: sidebar colapsável (`260px` expandido / `64px` colapsado) + header fixo (`64px`) + área de conteúdo
- Tooltips no sidebar colapsado (PrimeNG `pTooltip`)
- Mobile-first para portal do cliente; desktop-first para Admin/Operador
- Feedback visual: estados de loading/error inline, confirmação para operações destrutivas via `lync-confirm-dialog`

---

## Shared Component Library

All reusable UI primitives live at `src/app/shared/components/`. Always prefer these over ad-hoc HTML elements or inline PrimeNG usage.

### `EntityDialogComponent` — `lync-entity-dialog`

Generic create / edit modal backed by `p-dialog`.

| Input | Type | Description |
|---|---|---|
| `title` | `string` (required) | Dialog header title |
| `visible` | `boolean` | Controls dialog visibility |
| `loading` | `boolean` | Disables buttons and shows spinner label |
| `wide` | `boolean` | Sets width to 680 px (for wider forms) |

| Output | Description |
|---|---|
| `submitted` | Fired when the user clicks Save |
| `cancelled` | Fired when the user clicks Cancel or closes the dialog |
| `visibleChange` | Two-way binding for `visible` |

Form content goes into `ng-content`; Save / Cancel buttons appear in the footer automatically.

### `ConfirmDialogComponent` — `lync-confirm-dialog`

Destructive-action confirmation modal backed by `p-dialog`.

| Input | Default | Description |
|---|---|---|
| `open` | `false` | Controls visibility |
| `message` | `'Tem certeza?'` | Body message |
| `confirmLabel` | `'Confirmar'` | Label of the confirm button |
| `cancelLabel` | `'Cancelar'` | Label of the cancel button |
| `danger` | `true` | Uses danger styling for confirm button |
| `loading` | `false` | Disables buttons while an action is in progress |

### `FormFieldComponent` — `lync-form-field`

Thin wrapper that renders a consistent `<label>`, content slot (`ng-content`), and optional error / hint text. Use inside a `form-grid` container.

| Input | Description |
|---|---|
| `label` | Label text (required) |
| `required` | Appends a red `*` to the label |
| `errorMessage` | Inline error shown below the input |
| `hint` | Hint text shown when no error is present |
| `full` | Spans both columns of a two-column `form-grid` |

### `AppButtonComponent` — `lync-btn`

Dumb button that encapsulates visual variants and loading state.

| Input | Type | Default |
|---|---|---|
| `label` | `string` (required) | — |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` |
| `icon` | PrimeIcons class | `''` |
| `loading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `type` | `'button' \| 'submit'` | `'button'` |

Output: `clicked` — emits when the button is pressed and is not disabled/loading.

---

## Tratamento de Erros Globais (HTTP)

Todos os erros HTTP são tratados de forma centralizada em `core/interceptors/error.interceptor.ts`. O interceptor mapeia os status codes para mensagens em português e exibe toasts via PrimeNG `MessageService`.

| Status | Mensagem |
|---|---|
| `0` (rede) | "Sem conexão com o servidor." |
| `400` / `422` | Mensagem do servidor, ou "Dados inválidos." |
| `401` | Repassado ao `refresh-token.interceptor` |
| `403` | "Sem permissão para realizar esta ação." |
| `404` | "Recurso não encontrado." |
| `409` | Mensagem do servidor, ou "Conflito ao processar." |
| `500+` | "Erro interno do servidor." |

O outlet `<p-toast position="top-right" />` está montado em `app.html`. **Componentes não devem duplicar mensagens de erro** — apenas gerenciar estados de `loading` e sucesso.

---

## Shared Types (`packages/shared-types`)

O pacote `@rcar/shared-types` é a **fonte única de verdade** para todos os tipos de domínio compartilhados entre frontend e backend.

```typescript
import type { User, RentalContract, PaginatedResponse } from '@rcar/shared-types';
// ou via re-export local:
import type { User } from '@shared/models/entities.model';
```

| Categoria    | Tipos                                                                              |
|--------------|-----------------------------------------------------------------------------------|
| Enums        | `UserRole`, `CustomerType`, `VehicleStatus`, `ContractStatus`, `PaymentMethod`, … |
| Auth         | `User`, `AuthTokens`, `LoginCredentials`                                           |
| Entidades    | `Customer`, `Vehicle`, `WashService`, `Product`, `RentalContract`, `Template`, …  |
| Paginação    | `PaginatedResponse<T>`                                                             |

---

## SCSS — Convenções

- `src/styles/_variables.scss` — todos os design tokens (cores, espaçamentos, breakpoints, layout)
- `src/styles/_admin.scss` — utilitários globais da área interna; **não redefinir** em SCSS de componentes
- Sempre `@use 'variables' as *;` nos SCSS de componentes que precisam de tokens
- Nunca valores hardcoded (hex, px solto, font-family literal)
