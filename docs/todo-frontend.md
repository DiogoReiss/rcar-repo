# RCar — TODO Frontend (Angular 21)

## Legenda

- 🔴 Não iniciado
- 🟡 Em andamento
- 🟢 Concluído

---

## 1. Inicialização do Projeto Angular

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 1.1 | Criar app Angular 21 em `apps/web` via `ng new` com standalone APIs, SCSS, SSR desabilitado, prefix `rcar` |
| 🟢 | 1.2 | Remover arquivos boilerplate desnecessários (demo component, styles padrão) |
| 🟢 | 1.3 | Configurar `angular.json`: `stylePreprocessorOptions.includePaths` para `src/styles` |
| 🟢 | 1.4 | Mover os arquivos SCSS compartilhados (`_variables.scss`, `_mixins.scss`, `_index.scss`) para `apps/web/src/styles/` |
| 🟢 | 1.5 | Configurar path aliases no `tsconfig.json` (`@core/*`, `@shared/*`, `@admin/*`, `@lavajato/*`, `@aluguel/*`, `@portal/*`, `@env/*`) |
| 🟢 | 1.6 | Adicionar `environments/environment.ts` e `environments/environment.prod.ts` com `apiUrl` |
| 🟢 | 1.7 | Verificar build: `pnpm --filter web build` |

---

## 2. Configuração de Testes

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 2.1 | Instalar Vitest + `@analogjs/vite-plugin-angular` para testes unitários |
| 🟢 | 2.2 | Criar `vitest.config.unit.ts` com globals e setup file `src/test-setup.unit.ts` |
| 🟢 | 2.3 | Instalar Vitest browser mode e configurar `vitest.config.browser.ts` |
| 🟢 | 2.4 | Instalar Playwright e criar configuração `playwright.config.ts` |
| 🟢 | 2.5 | Adicionar scripts no `package.json`: `test:unit`, `test:browser`, `test:e2e` |
| 🟢 | 2.6 | Criar teste smoke unitário para validar pipeline |

---

## 3. Instalação de Dependências Core

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 3.1 | Instalar PrimeNG (`primeng`, `primeicons`, `@primeng/themes`) |
| 🟢 | 3.2 | Configurar PrimeNG no `app.config.ts` (providePrimeNG, tema, animações) |
| 🟢 | 3.3 | Instalar `@ngrx/signals` para Signal Store Events (estado global) |
| 🟢 | 3.4 | Instalar `@angular/cdk` (dependência de PrimeNG e utilitários) |

---

## 4. Estrutura Base (Core)

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 4.1 | Criar `src/app/core/services/api.service.ts` (wrapper HttpClient com baseUrl) |
| 🟢 | 4.2 | Criar `src/app/core/auth/services/auth.service.ts` (login, logout, refresh, currentUser signal) |
| 🟢 | 4.3 | Criar `src/app/core/auth/interceptors/auth.interceptor.ts` (injetar Bearer token) |
| 🟢 | 4.4 | Criar `src/app/core/auth/interceptors/refresh-token.interceptor.ts` (renovar token 401) |
| 🟢 | 4.5 | Criar `src/app/core/auth/guards/auth.guard.ts` (verificar autenticação) |
| 🟢 | 4.6 | Criar `src/app/core/auth/guards/role.guard.ts` (RBAC por rota) |
| 🟢 | 4.7 | Criar `src/app/core/auth/models/user.model.ts` (interface User, roles) |
| 🟢 | 4.8 | Criar `src/app/core/store/` (app-events, app-reducers, app-selectors, app-effects, app-store) |

---

## 5. Layout Shell

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 5.1 | Criar `src/app/core/layout/shell/shell.ts` (componente wrapper: sidebar + header + router-outlet) |
| 🟢 | 5.2 | Criar `src/app/core/layout/sidebar/sidebar.ts` (menu lateral colapsável com PrimeNG Menu/PanelMenu) |
| 🟢 | 5.3 | Criar `src/app/core/layout/header/header.ts` (barra superior com info do usuário, toggle sidebar) |
| 🟢 | 5.4 | Aplicar estilos base usando as variáveis SCSS (`$sidebar-width`, `$header-height`, etc.) |
| 🟢 | 5.5 | Garantir acessibilidade do layout (landmarks ARIA, foco navegável, skip-link) |

---

## 6. Roteamento Principal

| Status | Step | Descrição |
|--------|------|-----------|
| 🟢 | 6.1 | Configurar `app.routes.ts` com lazy-loading para `admin`, `lavajato`, `aluguel`, `portal-cliente`, `auth` |
| 🟢 | 6.2 | Configurar `app.config.ts` com `provideRouter`, `provideHttpClient` (withInterceptors), `provideAnimationsAsync` |
| 🟢 | 6.3 | Criar `src/app/core/auth/auth.routes.ts` (login, forgot-password, reset-password) |
| 🟢 | 6.4 | Criar `src/app/admin/admin.routes.ts` (dashboard, usuarios, servicos, frota, clientes, templates, relatorios) |
| 🟢 | 6.5 | Criar `src/app/lavajato/lavajato.routes.ts` (agendamento, fila, atendimentos) |
| 🟢 | 6.6 | Criar `src/app/aluguel/aluguel.routes.ts` (reserva, contratos, devolucao) |
| 🟢 | 6.7 | Criar `src/app/portal-cliente/portal.routes.ts` (meus-agendamentos, minhas-reservas, meus-documentos, historico) |

---

## 7. Shared Components

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 7.1 | Criar `src/app/shared/components/data-table/` (wrapper PrimeNG Table com paginação e filtros) |
| 🔴 | 7.2 | Criar `src/app/shared/components/confirm-dialog/` (wrapper PrimeNG ConfirmDialog) |
| 🔴 | 7.3 | Criar `src/app/shared/components/file-upload/` (wrapper PrimeNG FileUpload para S3) |
| 🔴 | 7.4 | Criar `src/app/shared/components/status-badge/` (badge colorido por status genérico) |
| 🔴 | 7.5 | Criar `src/app/shared/pipes/currency-brl.pipe.ts` (formatar para R$) |
| 🔴 | 7.6 | Criar `src/app/shared/pipes/date-br.pipe.ts` (formatar datas pt-BR) |
| 🔴 | 7.7 | Criar `src/app/shared/directives/has-role.directive.ts` (mostrar/esconder por role) |
| 🔴 | 7.8 | Criar `src/app/shared/models/pagination.model.ts` e `api-response.model.ts` |

---

## 8. Feature: Autenticação (Frontend)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 8.1 | Criar `src/app/core/auth/pages/login/login.ts` (formulário com email + senha, PrimeNG InputText + Password + Button) |
| 🔴 | 8.2 | Criar `src/app/core/auth/pages/forgot-password/forgot-password.ts` |
| 🔴 | 8.3 | Criar `src/app/core/auth/pages/reset-password/reset-password.ts` |
| 🔴 | 8.4 | Implementar lógica de login no auth.service (chamar API, guardar tokens, emitir user signal) |
| 🔴 | 8.5 | Testes unitários para auth.service, auth.guard, role.guard |

---

## 9. Feature: Admin — Gestão de Usuários

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 9.1 | Criar `src/app/admin/usuarios/usuarios-list/usuarios-list.ts` (tabela com filtro por nome/email/role) |
| 🔴 | 9.2 | Criar `src/app/admin/usuarios/usuario-form/usuario-form.ts` (formulário criar/editar com validação) |
| 🔴 | 9.3 | Implementar toggle ativar/desativar na listagem |
| 🔴 | 9.4 | Criar service `UsuariosService` com signals (lista, loading, CRUD methods) |
| 🔴 | 9.5 | Testes unitários dos componentes e service |

---

## 10. Feature: Admin — Catálogo de Serviços (Lavajato)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 10.1 | Criar `src/app/admin/servicos/servicos-list/servicos-list.ts` (tabela: nome, preço, duração, status) |
| 🔴 | 10.2 | Criar `src/app/admin/servicos/servico-form/servico-form.ts` (formulário com validação: nome, preço, duração, descrição) |
| 🔴 | 10.3 | Implementar toggle ativar/desativar |
| 🔴 | 10.4 | Criar service `ServicosService` com signals |
| 🔴 | 10.5 | Testes unitários |

---

## 11. Feature: Admin — Gestão da Frota

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 11.1 | Criar `src/app/admin/frota/frota-list/frota-list.ts` (tabela com filtro por status/categoria) |
| 🔴 | 11.2 | Criar `src/app/admin/frota/veiculo-form/veiculo-form.ts` (placa, modelo, ano, cor, categoria + upload fotos) |
| 🔴 | 11.3 | Criar `src/app/admin/frota/veiculo-detail/veiculo-detail.ts` (detalhe com histórico de contratos e manutenções) |
| 🔴 | 11.4 | Criar service `FrotaService` com signals |
| 🔴 | 11.5 | Testes unitários |

---

## 12. Feature: Admin — Gestão de Clientes

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 12.1 | Criar `src/app/admin/clientes/clientes-list/clientes-list.ts` (tabela com filtro PF/PJ e busca) |
| 🔴 | 12.2 | Criar `src/app/admin/clientes/cliente-form/cliente-form.ts` (formulário dinâmico PF ou PJ, upload CNH) |
| 🔴 | 12.3 | Criar `src/app/admin/clientes/cliente-detail/cliente-detail.ts` (detalhe com histórico unificado) |
| 🔴 | 12.4 | Criar service `ClientesService` com signals |
| 🔴 | 12.5 | Testes unitários |

---

## 13. Feature: Lavajato — Agendamento

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 13.1 | Criar `src/app/lavajato/agendamento/calendario/calendario.ts` (PrimeNG Calendar com horários disponíveis) |
| 🔴 | 13.2 | Criar `src/app/lavajato/agendamento/agendamento-form/agendamento-form.ts` (cliente + serviço + data/hora) |
| 🔴 | 13.3 | Criar `src/app/lavajato/atendimentos/atendimentos-dia/atendimentos-dia.ts` (painel do operador com agendamentos do dia) |
| 🔴 | 13.4 | Implementar controle de status do agendamento (AGENDADO → EM_ATENDIMENTO → CONCLUIDO/CANCELADO) |
| 🔴 | 13.5 | Criar service `AgendamentoService` com signals |
| 🔴 | 13.6 | Testes unitários |

---

## 14. Feature: Lavajato — Fila Presencial

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 14.1 | Criar `src/app/lavajato/fila/fila-painel/fila-painel.ts` (painel real-time via SSE com lista ordenada por posição) |
| 🔴 | 14.2 | Criar `src/app/lavajato/fila/fila-adicionar/fila-adicionar.ts` (formulário: cliente/nome avulso + serviço + placa) |
| 🔴 | 14.3 | Implementar controles de status (AGUARDANDO → EM_ATENDIMENTO → CONCLUIDO) |
| 🔴 | 14.4 | Criar `src/app/core/services/sse.service.ts` (serviço genérico de conexão SSE nativa) |
| 🔴 | 14.5 | Criar service `FilaService` com signals + integração SSE |
| 🔴 | 14.6 | Testes unitários |

---

## 15. Feature: Lavajato — Pagamentos

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 15.1 | Criar modal/dialog de registro de pagamento (PrimeNG Dialog) |
| 🔴 | 15.2 | Implementar seleção de método (DINHEIRO, PIX, CARTAO_CREDITO, CARTAO_DEBITO) |
| 🔴 | 15.3 | Integrar com confirmação de agendamento/fila |
| 🔴 | 15.4 | Testes unitários |

---

## 16. Feature: Aluguel — Reservas

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 16.1 | Criar `src/app/aluguel/reserva/disponibilidade/disponibilidade.ts` (seleção de categoria + período + exibição de veículos disponíveis) |
| 🔴 | 16.2 | Criar `src/app/aluguel/reserva/reserva-form/reserva-form.ts` (cliente + veículo + datas + cálculo de preço) |
| 🔴 | 16.3 | Criar `src/app/aluguel/reserva/reserva-confirmacao/reserva-confirmacao.ts` (resumo + botão confirmar) |
| 🔴 | 16.4 | Criar service `ReservaService` com signals |
| 🔴 | 16.5 | Testes unitários |

---

## 17. Feature: Aluguel — Contratos

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 17.1 | Criar `src/app/aluguel/contratos/contrato-list/contrato-list.ts` (tabela com filtro por status) |
| 🔴 | 17.2 | Criar `src/app/aluguel/contratos/contrato-abertura/contrato-abertura.ts` (vincular reserva ou criar direto, vistoria de saída) |
| 🔴 | 17.3 | Criar `src/app/aluguel/contratos/contrato-abertura/vistoria-saida/vistoria-saida.ts` (checklist + upload fotos) |
| 🔴 | 17.4 | Criar `src/app/aluguel/contratos/contrato-detail/contrato-detail.ts` (detalhe completo + timeline) |
| 🔴 | 17.5 | Criar service `ContratoService` com signals |
| 🔴 | 17.6 | Testes unitários |

---

## 18. Feature: Aluguel — Devolução

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 18.1 | Criar `src/app/aluguel/devolucao/vistoria-chegada/vistoria-chegada.ts` (checklist comparativo saída vs. chegada + fotos) |
| 🔴 | 18.2 | Criar `src/app/aluguel/devolucao/fechamento/fechamento.ts` (extras: km excedente, combustível, avarias + valor final) |
| 🔴 | 18.3 | Integrar com registro de pagamento |
| 🔴 | 18.4 | Testes unitários |

---

## 19. Feature: Admin — Templates e PDF

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 19.1 | Criar `src/app/admin/templates/templates-list/templates-list.ts` (tabela: nome, tipo, status) |
| 🔴 | 19.2 | Criar `src/app/admin/templates/template-editor/template-editor.ts` (textarea para HTML + lista de variáveis disponíveis) |
| 🔴 | 19.3 | Criar `src/app/admin/templates/template-preview/template-preview.ts` (preview renderizado com dados de exemplo via innerHTML sanitizado) |
| 🔴 | 19.4 | Implementar botão "Gerar PDF" em contratos e recibos (chama API de renderização) |
| 🔴 | 19.5 | Testes unitários |

---

## 20. Feature: Assinatura Digital (D4Sign)

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 20.1 | Criar botão "Enviar para Assinatura" no detalhe do contrato |
| 🔴 | 20.2 | Criar badge de status da assinatura (PENDENTE, ASSINADO, REJEITADO) |
| 🔴 | 20.3 | Criar service `AssinaturaService` para integração com endpoints D4Sign |
| 🔴 | 20.4 | Testes unitários |

---

## 21. Lint e CI

| Status | Step | Descrição |
|--------|------|-----------|
| 🔴 | 21.1 | Configurar ESLint com `@angular-eslint` e regras customizadas |
| 🔴 | 21.2 | Configurar Prettier |
| 🔴 | 21.3 | Adicionar script `pnpm --filter web lint` |
| 🔴 | 21.4 | Validar que `pnpm --filter web build` passa sem erros |

