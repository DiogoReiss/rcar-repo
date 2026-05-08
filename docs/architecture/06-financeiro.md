# RCar — Arquitetura Financeira

## Visão Geral

O RCar opera dois negócios que geram receita e consomem recursos:

| Negócio       | Receita                      | Custos diretos                            |
|---------------|------------------------------|-------------------------------------------|
| **Lavajato**  | Serviços de lavagem          | Insumos (estoque), mão de obra            |
| **Renting**   | Diárias / semanal / mensal   | Manutenção de frota, depreciação, seguros |

Abaixo descrevemos o que **já existe** implementado, o que **precisa melhorar**, e o modelo proposto para fechar as lacunas.

---

## 1. O que já existe

### 1.1 Entidades financeiras no banco

| Modelo              | Campos financeiros                         | Propósito                              |
|---------------------|--------------------------------------------|----------------------------------------|
| `Payment`           | `valor`, `metodo`, `status`, `refType`     | Registra pagamentos (lavajato + aluguel) |
| `RentalContract`    | `valorDiaria`, `valorTotal`, `valorTotalReal`, `valorSeguro` | Receita de aluguel          |
| `ContractIncident`  | `valor`                                    | Custos extras (avaria, multa, KM excedente) |
| `VehicleMaintenance`| `custo`                                    | Custo de manutenção por veículo        |
| `WashService`       | `preco`                                    | Preço de tabela de cada serviço        |
| `Product`           | `custoUnitario`, `quantidadeAtual`         | Custo unitário de insumos do estoque   |
| `StockMovement`     | `quantidade`, `tipo`                       | Entrada/saída/ajuste de estoque        |
| `ServiceProduct`    | `quantidadePorUso`                         | Consumo de insumo por execução de serviço |

### 1.2 Fluxos implementados

```
RECEITA LAVAJATO
  └─ WashSchedule/WashQueue (CONCLUIDO)
       └─ Payment (CONFIRMADO, refType=WASH_SCHEDULE|WASH_QUEUE)

RECEITA ALUGUEL
  └─ RentalContract (RESERVADO→ATIVO→ENCERRADO)
       ├─ Payment (CONFIRMADO, refType=RENTAL_CONTRACT) [múltiplos por contrato]
       └─ ContractIncident (extras cobrados na devolução)

CUSTO MANUTENÇÃO
  └─ VehicleMaintenance (custo registrado, veículo → MANUTENCAO)

CUSTO INSUMOS (ESTOQUE)
  └─ StockMovement (tipo=SAIDA) → reduz Product.quantidadeAtual
```

### 1.3 Relatórios existentes

| Endpoint                   | O que retorna                                      |
|----------------------------|----------------------------------------------------|
| `GET /reports/dashboard`   | Contagens: users, vehicles, customers, services, low-stock |
| `GET /reports/daily`       | Agendados/concluídos do dia, receita estimada (lavajato + aluguel), alertas de estoque |
| `GET /reports/monthly`     | Receita confirmada (payments) por módulo, novos clientes, novos contratos |
| `GET /reports/charts`      | Serviços/dia, hora de pico, receita vs. saídas de estoque, uso de produtos (7 dias) |
| `GET /reports/stock`       | Produtos com quantidade atual, mínimo, flag de baixo estoque |

---

## 2. Lacunas e pontos a melhorar

### 2.1 Estoque — Custo real de consumo (COGS)

**Problema:** Sabemos a **quantidade** de insumo consumida (`StockMovement.tipo=SAIDA`) e o `custoUnitario` do produto, mas **não calculamos o custo total de consumo** por período nem por serviço executado.

**Solução proposta:**

```
Custo de Consumo por Serviço Executado =
  Σ (ServiceProduct.quantidadePorUso × Product.custoUnitario)
  para cada produto vinculado ao serviço

Custo de Operação Lavajato (mês) =
  Σ (StockMovement.quantidade × Product.custoUnitario)
  WHERE tipo = 'SAIDA' AND createdAt no período
```

**O que implementar:**

- [ ] Endpoint `GET /reports/stock/cost-analysis?from=&to=` — custo total de saídas por período
- [ ] No `getDailySummary` e `getMonthlyStats`, adicionar campo `custoInsumos`
- [ ] Dashboard: card "Custo de insumos" ao lado de "Receita Lavajato"
- [ ] Relatório: margem bruta do lavajato = `receitaLavajato - custoInsumos`

### 2.2 Manutenção — Custos por veículo e por período

**Problema:** `VehicleMaintenance.custo` é registrado mas **não há agregação** — não sabemos qual veículo custa mais, quanto gastamos por mês, nem tendência.

**Solução proposta:**

```
Custo Total Manutenção (mês) =
  Σ VehicleMaintenance.custo WHERE data no período

Custo por Veículo (lifetime) =
  Σ VehicleMaintenance.custo WHERE vehicleId = X

Média Mensal por Veículo =
  Custo lifetime / meses desde primeiro contrato ou cadastro
```

**O que implementar:**

- [ ] Endpoint `GET /reports/fleet/maintenance-costs?from=&to=` com breakdown por veículo
- [ ] No `getDailySummary` e `getMonthlyStats`, adicionar campo `custoManutencao`
- [ ] Detalhe do veículo: card com "Total gasto em manutenção" e lista de manutenções
- [ ] Dashboard: card "Custo de manutenção" no período

### 2.3 Aluguel — Receita real vs. prevista

**Problema:** O contrato tem `valorTotal` (previsto na criação) e `valorTotalReal` (calculado no fechamento com extras), mas **não há visão de recebimento real** — quanto do que foi faturado foi efetivamente pago.

**Fluxo completo:**

```
1. RESERVA     → valorTotal calculado (diária × dias)
2. ABERTURA    → contrato ativo, valorTotal mantido
3. DEVOLUÇÃO   → valorTotalReal calculado (extras: KM, combustível, multas)
4. PAGAMENTO   → Payment records vinculados (podem ser parciais, múltiplos)
5. FECHAMENTO  → status ENCERRADO

Receita Prevista  = Σ valorTotal       (contratos ATIVO + ENCERRADO)
Receita Real      = Σ valorTotalReal   (contratos ENCERRADO)
Receita Recebida  = Σ Payment.valor    (status CONFIRMADO, refType RENTAL_CONTRACT)
A Receber         = Receita Real - Receita Recebida
```

**O que implementar:**

- [ ] No `getMonthlyStats`, adicionar: `faturado`, `recebido`, `aReceber`
- [ ] Endpoint `GET /reports/rental/receivables` — contratos com saldo pendente
- [ ] Dashboard: card de "contas a receber" com aging (vencidos vs. a vencer)

### 2.4 Incidentes — Custos extras e receita adicional

**Problema:** `ContractIncident` registra `valor` mas não se distingue entre custo absorvido vs. cobrado do cliente.

**Regra de negócio:**

| Tipo          | Quem paga?      | Exemplo                          |
|---------------|-----------------|----------------------------------|
| AVARIA        | Cliente         | Arranhão, amassado               |
| MULTA         | Cliente         | Multa de trânsito                |
| KM_EXCEDENTE  | Cliente         | Excedeu kmLimite                 |
| COMBUSTIVEL   | Cliente         | Devolveu com menos combustível   |
| OUTRO         | Depende         | Caso a caso                      |

**O que implementar:**

- [ ] Campo `cobradoCliente: Boolean` no `ContractIncident` (default true)
- [ ] Incidentes cobrados → somam ao `valorTotalReal` do contrato
- [ ] Relatório: total de incidentes por tipo e receita adicional gerada

### 2.5 Demonstrativo financeiro (DRE simplificado)

**Modelo proposto para o dashboard mensal:**

```
RECEITA BRUTA
  (+) Receita Lavajato .......... Σ payments WASH (CONFIRMADO)
  (+) Receita Aluguel ........... Σ payments RENTAL (CONFIRMADO)
  (+) Extras de Aluguel ......... Σ incidentes cobrados do cliente
  ────────────────────────────────────────────────────
  = RECEITA TOTAL

CUSTOS DIRETOS
  (-) Insumos Lavajato .......... Σ saídas de estoque × custo_unitario
  (-) Manutenção Frota .......... Σ vehicle_maintenances.custo
  ────────────────────────────────────────────────────
  = MARGEM BRUTA (Receita Total - Custos Diretos)

  Margem Bruta (%) = (Margem Bruta / Receita Total) × 100
```

> Custos operacionais (aluguel do espaço, salários, energia) ficam fora do sistema por enquanto — seria uma Fase futura com entidade `ExpenseCategory` + `Expense`.

**O que implementar:**

- [ ] Endpoint `GET /reports/financial-summary?from=&to=`
- [ ] Frontend: página `/admin/financeiro` com cards e tabela do DRE
- [ ] Export CSV/PDF do relatório financeiro

---

## 3. Fluxo de Entrada/Saída de Estoque

### 3.1 Entrada (compra de insumos)

```
Gestor compra produto → Registra StockMovement (tipo=ENTRADA, quantidade, motivo="Compra NF xxx")
  → Product.quantidadeAtual += quantidade
  → Custo da compra = quantidade × Product.custoUnitario (estimado)
```

**Melhoria:** O `custoUnitario` pode variar entre compras. Proposta:

- [ ] Adicionar campo `custoUnitario` ao `StockMovement` (tipo ENTRADA) — custo real desta compra
- [ ] `Product.custoUnitario` passa a ser **custo médio ponderado** (recalculado a cada entrada)
- [ ] Fórmula: `novoCusto = (qtyAnterior × custoAnterior + qtyEntrada × custoEntrada) / (qtyAnterior + qtyEntrada)`

### 3.2 Saída (consumo em serviço)

```
Serviço concluído → Para cada ServiceProduct vinculado:
  → StockMovement (tipo=SAIDA, quantidade=quantidadePorUso, motivo="Serviço: Lavagem Completa")
  → Product.quantidadeAtual -= quantidadePorUso
```

**Status:** A baixa automática por serviço concluído **não está implementada**. Hoje as saídas são manuais.

**O que implementar:**

- [ ] Ao concluir `WashSchedule` ou `WashQueue`, criar StockMovements automáticos baseados em `ServiceProduct`
- [ ] Alerta no dashboard quando produto atinge `estoqueMinimo`
- [ ] Relatório: consumo de insumos vs. serviços executados (eficiência)

### 3.3 Ajuste (inventário)

```
Contagem física difere do sistema → StockMovement (tipo=AJUSTE, quantidade=diferença, motivo="Inventário mensal")
  → Product.quantidadeAtual = quantidadeContada
```

**Status:** Já implementado (criação manual de `StockMovement` com tipo `AJUSTE`).

### 3.4 Valoração do estoque

```
Valor do Estoque = Σ (Product.quantidadeAtual × Product.custoUnitario)
  para todos os produtos ativos
```

**O que implementar:**

- [ ] Card no dashboard de estoque: "Valor total em estoque: R$ X.XXX"
- [ ] No relatório mensal: variação de estoque (valor início vs. valor fim do período)

---

## 4. Custos de Manutenção

### 4.1 Modelo atual

```prisma
model VehicleMaintenance {
  id        String   @id @default(uuid())
  vehicleId String
  descricao String          // "Troca de óleo", "Funilaria"
  custo     Decimal(10,2)   // Valor pago / orçado
  data      DateTime        // Data do serviço
  createdAt DateTime
}
```

### 4.2 Melhorias propostas

- [ ] Adicionar campo `tipo` enum: `PREVENTIVA | CORRETIVA | SINISTRO`
- [ ] Adicionar campo `status` enum: `PENDENTE | CONCLUIDA` (para manutenções agendadas mas não finalizadas)
- [ ] Adicionar campo `fornecedor: String?` (nome da oficina/mecânico)
- [ ] Relatório: custo preventiva vs. corretiva — preventiva reduz custo de corretiva ao longo do tempo

### 4.3 KPIs de manutenção

| KPI                        | Fórmula                                      |
|----------------------------|----------------------------------------------|
| Custo total no período     | Σ `custo` WHERE `data` no período            |
| Custo médio por veículo    | Custo total / nº veículos com manutenção     |
| Veículo mais caro          | MAX por `vehicleId` agrupado                 |
| Frequência de manutenção   | Contagem / veículo / mês                     |
| % do custo vs. receita     | Custo manutenção / Receita aluguel × 100     |

---

## 5. Ganhos do Aluguel

### 5.1 Ciclo econômico de um contrato

```
┌──────────────────────────────────────────────────────────┐
│  RESERVA (RESERVADO)                                      │
│  valorDiaria = R$ 120,00                                  │
│  dataRetirada = 2026-05-10  dataDevolucao = 2026-05-15    │
│  valorTotal = 120 × 5 dias = R$ 600,00                    │
│  seguro = true → valorSeguro = R$ 50,00                   │
│  TOTAL PREVISTO = R$ 650,00                               │
└───────────────────┬──────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────┐
│  ABERTURA (ATIVO)                                         │
│  kmRetirada = 45.000 km                                   │
│  combustivelSaida = CHEIO                                 │
│  Inspeção de SAIDA (checklist + fotos)                    │
└───────────────────┬──────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────┐
│  DEVOLUÇÃO (ENCERRADO)                                    │
│  dataDevReal = 2026-05-16 (+1 dia de atraso)              │
│  kmDevolucao = 45.850 km (850 km rodados)                 │
│  combustivelChegada = 1/2 (devolveu pela metade)          │
│  Inspeção de CHEGADA (checklist + fotos)                  │
│                                                           │
│  CÁLCULO DE EXTRAS:                                       │
│  + Diária extra: R$ 120,00 (1 dia adicional)              │
│  + Combustível: R$ 80,00 (reposição CHEIO→1/2)            │
│  + KM excedente: 350 km × R$ 0,50 = R$ 175,00            │
│    (limite era 500 km, rodou 850 → excedeu 350 km)        │
│                                                           │
│  valorTotalReal = 650 + 120 + 80 + 175 = R$ 1.025,00     │
└───────────────────┬──────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────┐
│  PAGAMENTOS                                               │
│  Payment #1: R$ 650,00 (PIX, na abertura) ✓ CONFIRMADO   │
│  Payment #2: R$ 375,00 (CARTÃO, na devolução) ✓ CONFIRM. │
│                                                           │
│  RESUMO:                                                  │
│  Faturado = R$ 1.025,00                                   │
│  Recebido = R$ 1.025,00                                   │
│  Pendente = R$ 0,00                                       │
└──────────────────────────────────────────────────────────┘
```

### 5.2 KPIs de aluguel

| KPI                         | Fórmula                                       |
|-----------------------------|-----------------------------------------------|
| Receita prevista            | Σ `valorTotal` (ATIVO + ENCERRADO)            |
| Receita real                | Σ `valorTotalReal` (ENCERRADO)                |
| Receita recebida            | Σ `Payment.valor` (CONFIRMADO, RENTAL_CONTRACT) |
| Inadimplência               | Receita real - Receita recebida               |
| Taxa de ocupação            | Veículos ALUGADO / Total veículos × 100       |
| Ticket médio                | Receita recebida / Contratos encerrados       |
| Diária média praticada      | Σ `valorDiaria` / Contratos                   |
| Receita por veículo (mês)   | Receita recebida veículo X / meses            |
| Rentabilidade por veículo   | (Receita - Manutenção) / veículo              |

### 5.3 Retorno por veículo (ROI simplificado)

```
Receita acumulada (veículo X) - Custo de manutenção acumulado = Lucro bruto do veículo
Lucro bruto / Custo de aquisição (se rastreado) = ROI (%)

Sem custoAquisicao no schema → considerar implementação futura
```

---

## 6. Pagamentos — Status e rastreabilidade

### 6.1 Modelo atual

```prisma
model Payment {
  refType     PaymentRefType  // WASH_SCHEDULE | WASH_QUEUE | RENTAL_CONTRACT
  valor       Decimal
  metodo      PaymentMethod   // DINHEIRO | PIX | CARTAO_CREDITO | CARTAO_DEBITO
  status      PaymentStatus   // PENDENTE | CONFIRMADO | CANCELADO
  scheduleId  String?         // 1:1 para wash
  queueId     String?         // 1:1 para wash walk-in
  contractId  String?         // N:1 para rental (múltiplos pagamentos por contrato)
  customerId  String?
}
```

### 6.2 Melhorias propostas

- [ ] Endpoint standalone `GET /payments?from=&to=&refType=&status=&metodo=` — listagem centralizada
- [ ] Relatório de pagamentos: totais por método (PIX vs cartão vs dinheiro)
- [ ] Reconciliação: pagamentos PENDENTE pendentes há mais de N dias → alerta

### 6.3 Distribuição por método (dashboard)

```
Gráfico pizza/doughnut:
  PIX: 45%
  CARTÃO CRÉDITO: 30%
  CARTÃO DÉBITO: 15%
  DINHEIRO: 10%
```

---

## 7. Roadmap de implementação

### Fase atual (quick wins)

| Prioridade | Tarefa                                                       | Escopo    |
|------------|--------------------------------------------------------------|-----------|
| P1         | Endpoint `GET /reports/financial-summary` (DRE simplificado) | Backend   |
| P1         | Custo de insumos no relatório diário/mensal                  | Backend   |
| P1         | Custo de manutenção no relatório diário/mensal               | Backend   |
| P2         | Baixa automática de estoque ao concluir serviço              | Backend   |
| P2         | Card "Contas a receber" no dashboard                         | Full stack|
| P2         | `custoUnitario` no StockMovement (ENTRADA)                   | Schema    |

### Fase 2 (Pagar.me + online)

| Prioridade | Tarefa                                                       | Escopo    |
|------------|--------------------------------------------------------------|-----------|
| P1         | Integração Pagar.me (PIX, cartão)                            | Backend   |
| P1         | Webhook de confirmação automática de pagamento               | Backend   |
| P2         | Cobrança automática no fechamento de contrato                | Full stack|
| P3         | Boleto com vencimento e alerta de inadimplência              | Backend   |

### Fase 3 (análise e otimização)

| Prioridade | Tarefa                                                       | Escopo    |
|------------|--------------------------------------------------------------|-----------|
| P1         | Página `/admin/financeiro` com DRE visual + gráficos         | Frontend  |
| P1         | Rentabilidade por veículo (receita - manutenção)             | Full stack|
| P2         | Análise de custo-benefício: preventiva vs. corretiva         | Backend   |
| P2         | Export CSV/PDF do relatório financeiro                        | Full stack|
| P3         | Depreciation schedule (se `custoAquisicao` for adicionado)   | Schema    |

---

## 8. Queries úteis para validação

```sql
-- Receita confirmada do lavajato no mês
SELECT SUM(valor) FROM payments WHERE status = 'CONFIRMADO'
AND ref_type IN ('WASH_SCHEDULE', 'WASH_QUEUE')
AND created_at >= '2026-05-01' AND created_at < '2026-06-01';

-- Custo de insumos consumidos no mês
SELECT SUM(sm.quantidade * p.custo_unitario)
FROM stock_movements sm JOIN products p ON sm.product_id = p.id
WHERE sm.tipo = 'SAIDA'
AND sm.created_at >= '2026-05-01' AND sm.created_at < '2026-06-01';

-- Custo total de manutenção no mês
SELECT SUM(custo) FROM vehicle_maintenances
WHERE data >= '2026-05-01' AND data < '2026-06-01';

-- Contratos com saldo pendente
SELECT rc.id, rc.valor_total_real,
  COALESCE(SUM(p.valor) FILTER (WHERE p.status = 'CONFIRMADO'), 0) AS pago,
  rc.valor_total_real - COALESCE(SUM(p.valor) FILTER (WHERE p.status = 'CONFIRMADO'), 0) AS pendente
FROM rental_contracts rc
LEFT JOIN payments p ON p.contract_id = rc.id
WHERE rc.status = 'ENCERRADO'
GROUP BY rc.id HAVING rc.valor_total_real > COALESCE(SUM(p.valor) FILTER (WHERE p.status = 'CONFIRMADO'), 0);

-- Valor total do estoque
SELECT SUM(quantidade_atual * custo_unitario)
FROM products WHERE ativo = true AND deleted_at IS NULL;

-- Veículo com maior custo de manutenção
SELECT v.placa, v.modelo, SUM(vm.custo) AS total_manutencao
FROM vehicle_maintenances vm JOIN vehicles v ON vm.vehicle_id = v.id
GROUP BY v.id ORDER BY total_manutencao DESC LIMIT 5;
```

