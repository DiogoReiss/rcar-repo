# RCar — Arquitetura Frontend (Angular 21)

## Stack

- Angular 21 (standalone APIs)
- PrimeNG 21
- NgRx Signals (uso pontual para estado compartilhado)
- SCSS + tema light/dark
- Playwright + Vitest

---

## Estrutura de Pastas (apps/web/src/app)

```text
app/
├── core/
│   ├── auth/                 # login, register, guards, interceptors
│   ├── layout/               # shell, header, sidebar
│   ├── services/             # api/auth/theme/sse/storage
│   └── store/                # estado global essencial
├── shared/
│   ├── components/           # lync-entity-dialog, lync-confirm-dialog, etc.
│   ├── directives/           # has-role, utilitárias
│   └── pipes/                # formatadores reutilizáveis
├── admin/
│   ├── dashboard/
│   ├── usuarios/
│   ├── clientes/
│   ├── frota/
│   ├── servicos/
│   ├── estoque/
│   ├── templates/
│   └── financeiro/
├── lavajato/
│   ├── agendamento/
│   ├── fila/
│   └── atendimentos/
├── aluguel/
│   ├── disponibilidade/
│   ├── contratos/
│   ├── vistorias/
│   └── devolucao/
└── portal-cliente/
    ├── meus-agendamentos/
    ├── minhas-reservas/
    ├── meus-documentos/
    └── historico/
```

---

## Roteamento por área

- Rotas lazy por domínio: `admin`, `lavajato`, `aluguel`, `portal-cliente`.
- `core/auth` concentra login/refresh e proteção de rotas.
- `core/layout` define shell único para áreas autenticadas.

---

## RBAC no Frontend

Perfis em uso:

- `GESTOR_GERAL`
- `OPERADOR`
- `OPERADOR_LEITURA`
- `CLIENTE`

Padrões:

- `auth.guard`: autenticação
- `role.guard`: autorização por perfil
- `feature.guard`: autorização por funcionalidades do usuário interno
- `*lyncHasRole`: controle de visibilidade/habilitação de ações no template

Regra prática: `OPERADOR_LEITURA` visualiza páginas operacionais, mas não executa ações mutáveis.
- Navegação lateral e rotas de `lavajato`, `aluguel` e áreas administrativas são filtradas por `features`.
- `GESTOR_GERAL` tem acesso total independentemente da lista de funcionalidades.

---

## UX e Temas

- Tema dark está suportado e consolidado (variáveis de cor, contraste, componentes PrimeNG, estados visuais).
- Persistência de tema por usuário (`localStorage`), com fallback para preferência do sistema.
- Continuidade: manter consistência visual entre light/dark em componentes compartilhados e telas de negócio.

---

## Convenções

- Reuso prioritário de componentes compartilhados (`shared/components`).
- Estado local preferencialmente com `signal()` em componentes/services.
- NgRx Signals para estado global entre features.
- Páginas com loading/empty/error explícitos.

---

## Destaques recentes — Fluxo de aluguel

- A tela `aluguel/contratos/contrato-list` cobre o fluxo completo: disponibilidade → reserva → abertura (vistoria de saída) → devolução (vistoria de chegada) → fechamento.
- A devolução permite registrar incidentes (`SINISTRO`, `AVARIA`, `MULTA`, `KM_EXCEDENTE`, `COMBUSTIVEL`, `OUTRO`) com `cobradoCliente` e projeção de `valorTotalReal`.
- Vistorias de saída e chegada aceitam anexos de fotos via `lync-file-upload` + `StorageService` (object keys no payload).
- Estados explícitos de loading/empty/error foram reforçados no list, busca de disponibilidade e dialogs principais.
