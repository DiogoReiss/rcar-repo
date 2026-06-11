# Implementação da Role OPERADOR_LEITURA

**Data:** 2026-06-11  
**Status:** ✅ Concluído (Schema + Enforcement)

---

## Objetivo

Adicionar uma nova role `OPERADOR_LEITURA` para funcionários que devem ter acesso somente leitura aos fluxos de serviços, sem permissão para criar, editar ou concluir operações.

---

## Alterações Implementadas

### 1. Schema Prisma (`apps/api/prisma/schema.prisma`)
- Adicionado `OPERADOR_LEITURA` ao enum `UserRole`
- Posicionado entre `OPERADOR` e `CLIENTE` na hierarquia

### 2. Shared Types (`packages/shared-types/src/index.ts`)
- Atualizado tipo `UserRole` para incluir `'OPERADOR_LEITURA'`
- Mantém sincronização entre backend e frontend

### 3. Documentação de Negócio (`docs/architecture/01-business.md`)
- Adicionado perfil `operador_leitura` na tabela de perfis de acesso
- Descrição: "Funcionários com acesso somente leitura — visualiza fluxos de serviços sem poder criar/editar/concluir"

### 4. Documentação Backend (`docs/architecture/03-backend.md`)
- Adicionada seção de roles disponíveis no RBAC
- Documentado comportamento esperado da nova role

### 5. Documentação Frontend (`docs/architecture/02-frontend.md`)
- Atualizado comentário do `role.guard.ts` para incluir a nova role

### 6. Migration Prisma
- Criada migration `20260611120000_add_operador_leitura_role`
- Script SQL: `ALTER TYPE "UserRole" ADD VALUE 'OPERADOR_LEITURA';`

### 7. Backend Guards e Enforcement ✅
- **`roles.guard.ts`** — já suportava arrays de roles (sem alteração necessária)
- **`roles.decorator.ts`** — já suportava múltiplas roles via spread operator (sem alteração necessária)
- **`lavajato.controller.ts`** — adicionado `RolesGuard` e decoradores `@Roles`:
  - GET endpoints: `@Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')`
  - POST/PATCH/DELETE endpoints: `@Roles('GESTOR_GERAL', 'OPERADOR')`

### 8. Frontend Directives ✅
- **`has-role.directive.ts`** — já suportava arrays de roles (sem alteração necessária)
- Uso: `*lyncHasRole="['OPERADOR']"` para restringir botões de ação
- Uso: `*lyncHasRole="['OPERADOR', 'OPERADOR_LEITURA']"` para visualização

### 9. Seed/Fixtures ✅
- Adicionado usuário `leitura@rcar.com.br` com role `OPERADOR_LEITURA` no seed
- Senha padrão: `mudar123`
- Disponível para testes locais e E2E

### 10. Tests ✅
- **Unit tests** (`roles.guard.spec.ts`):
  - Validação de OPERADOR_LEITURA em arrays de roles
  - Validação de rejeição quando não incluído
  - Validação de múltiplas roles funcionando corretamente
- **E2E tests** (`roles-permissions.e2e-spec.ts`):
  - Testes de acesso GET para OPERADOR_LEITURA (deve passar)
  - Testes de acesso POST/DELETE para OPERADOR_LEITURA (deve falhar com 403)
  - Testes comparativos com OPERADOR e GESTOR_GERAL

---

## Validação

✅ Prisma Client gerado com sucesso  
✅ Nenhum erro de compilação nos arquivos alterados  
✅ Documentação sincronizada em todos os níveis  
✅ Guards backend aplicados com suporte a arrays  
✅ Directive frontend já suportava comportamento necessário  
✅ Seed atualizado com usuário de teste  
✅ Testes unitários e E2E criados

---

## Implementação Completa

Todos os itens dos "Próximos Passos" foram implementados:

1. ✅ **Backend Guards** — Controllers atualizados com `@Roles` em GET (leitura) e POST/PATCH/DELETE (escrita)
2. ✅ **Frontend Directives** — Diretiva `*lyncHasRole` já suportava arrays
3. ✅ **Seed/Fixtures** — Usuário `leitura@rcar.com.br` adicionado ao seed
4. ✅ **Tests** — Unit tests expandidos + E2E test dedicado para permissions

---

## Hierarquia de Roles

1. `GESTOR_GERAL` — acesso total (criar/ler/editar/excluir)
2. `OPERADOR` — acesso operacional (criar/ler/editar/concluir atendimentos)
3. `OPERADOR_LEITURA` — acesso somente leitura (visualizar fluxos)
4. `CLIENTE` — acesso ao portal do cliente (próprios dados)

---

## Uso Prático

### Backend - Adicionar roles em novos controllers

```typescript
import { Roles } from '@common/decorators/roles.decorator.js';
import { RolesGuard } from '@common/guards/roles.guard.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exemplo')
export class ExemploController {
  // Endpoint de leitura - permite OPERADOR_LEITURA
  @Get()
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  findAll() { }

  // Endpoint de escrita - só OPERADOR e GESTOR_GERAL
  @Post()
  @Roles('GESTOR_GERAL', 'OPERADOR')
  create() { }
}
```

### Frontend - Uso da directive

```html
<!-- Visualização permitida para leitura e escrita -->
<div *lyncHasRole="['OPERADOR', 'OPERADOR_LEITURA']">
  <h2>Fila de Atendimentos</h2>
  <table>...</table>
</div>

<!-- Botões de ação só para quem pode editar -->
<button *lyncHasRole="['OPERADOR']" (click)="avançar()">
  Avançar Status
</button>
```

---

## Credenciais de Teste

- **Gestor:** `admin@rcar.com.br` / `mudar123`
- **Operador:** `operador@rcar.com.br` / `mudar123`
- **Leitura:** `leitura@rcar.com.br` / `mudar123` ✨
- **Cliente:** (via registro no portal)



