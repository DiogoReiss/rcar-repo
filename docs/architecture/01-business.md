# RCar — Regras de Negócio

## Visão Geral

A RCar opera dois negócios em uma única plataforma:

1. **RCar Lavajato** — agendamento e atendimento presencial
2. **RCar Renting** — aluguel de veículos (PF e PJ)

Administração centralizada no **RCar Admin**.

> Linguagem de domínio consolidada em [`glossario.md`](./glossario.md).

---

## Perfis de Acesso

| Perfil | Descrição |
|---|---|
| `GESTOR_GERAL` | Acesso total de operação, financeiro, administração e configurações |
| `OPERADOR` | Operação diária com permissões de criação/edição/conclusão |
| `OPERADOR_LEITURA` | Acesso somente leitura para fluxos operacionais (sem criação/edição/conclusão) |
| `CLIENTE` | Acesso ao portal do cliente, limitado aos próprios dados |

Regras de autorização devem permanecer em RBAC (backend + frontend), com separação clara entre leitura e escrita.

---

## Módulo: RCar Admin

### Capacidades

- Dashboard operacional e financeiro
- Gestão de usuários e perfis
- Catálogo de serviços do lavajato
- Gestão de estoque e movimentações
- Gestão de frota e manutenções
- Gestão de clientes PF/PJ
- Templates de documentos
- Relatórios e exportações

### Regras importantes

- Serviços desativados não perdem histórico.
- Veículo em `ALUGADO`/`MANUTENCAO` não aparece como disponível.
- Estoque baixo deve gerar alerta de operação.
- Todo evento crítico deve ser auditável.

---

## Módulo: RCar Lavajato

### Fluxo de agendamento

Cliente escolhe serviço e horário, confirma e recebe retorno por e-mail.

### Fluxo de fila presencial

Operador registra atendimento na **fila** → evolução de status → pagamento registrado → emissão de recibo via template.

### Regras

- Serviços são dinâmicos (admin).
- Disponibilidade baseada em slot e duração.
- Pagamento registrado no sistema (não processado online no estado atual).

---

## Módulo: RCar Renting

### Fluxo de reserva

Cliente consulta disponibilidade por período, envia documentos e confirma reserva.

### Abertura de contrato

Operador vincula veículo, executa vistoria de saída e gera documentação.

- Assinatura digital (integração D4Sign) — **🔴 Planejado — não implementado**

### Devolução

Vistoria de chegada, apuração de extras e fechamento financeiro.

### Regras

- Caução/seguro fazem parte do contrato.
- Cobrança online via Pagar.me — **🔴 Planejado — não implementado**
- Ocorrências/incidentes devem ficar vinculadas ao contrato.

### Operação em Lote e Cobrança Recorrente — **🔴 Planejado — não implementado**

Escopo previsto para acordos com múltiplos veículos, contrato-mestre e cobrança consolidada recorrente. Mantido como trilha futura de negócio.

---

## Módulo: RCar Financeiro

Detalhamento completo em [`06-financeiro.md`](./06-financeiro.md).

Pontos de domínio:

- Receita por lavagem e aluguel
- Custo de manutenção de frota
- COGS por insumos do lavajato
- Contas a receber e rentabilidade

---

## Integrações Externas

| Serviço | Finalidade | Status |
|---|---|---|
| SMTP/SES | E-mails transacionais (confirmações, recuperação, notificações) | 🟢 Implementado |
| D4Sign | Assinatura digital de documentos de aluguel | 🔴 Planejado — não implementado |
| Pagar.me | Pagamentos online (Pix/cartão/boleto) | 🔴 Planejado — não implementado |
| WhatsApp API | Notificações de operação e relacionamento | 🔴 Planejado — não implementado |

---

## Regras Transversais

- Todo registro financeiro deve conter valor, método, data e usuário responsável.
- Toda ação crítica deve ser auditável.
- Documentos sensíveis devem usar armazenamento privado com URL assinada.
- Sistema web-first, com operação administrativa e portal do cliente.
