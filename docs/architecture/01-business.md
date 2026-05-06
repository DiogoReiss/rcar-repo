# RCar — Regras de Negócio

## Visão Geral

A RCar é uma holding familiar que opera dois negócios:

1. **RCar Lavajato** — Serviços de lavagem automotiva (agendamento online + atendimento presencial)
2. **RCar Renting** — Aluguel de veículos para pessoa física e jurídica

Ambos são gerenciados por um painel administrativo unificado: **RCar Admin**.

---

## Perfis de Acesso

| Perfil         | Descrição                                                        |
|----------------|------------------------------------------------------------------|
| `gestor_geral` | Sócios/gestores — acesso total a módulos, relatórios e configs   |
| `operador`     | Funcionários — visualiza agendamentos, fila, contratos ativos    |
| `cliente`      | Cliente final — reserva, acompanha histórico, envia documentos   |

> Inicialmente 3 funcionários. A estrutura de permissões deve ser extensível via banco de dados.

---

## Módulo: RCar Admin

### Funcionalidades

| Área              | Descrição                                                                 |
|-------------------|---------------------------------------------------------------------------|
| Dashboard         | KPIs diários: agendamentos, veículos alugados, receita estimada, alertas  |
| Gestão de Usuários| CRUD de funcionários com atribuição de perfil                             |
| Catálogo de Serviços | CRUD de serviços do lavajato (nome, preço, duração). Ativar/desativar sem perder histórico |
| Gestão de Estoque | CRUD de produtos do lavajato (insumos). Controle de entradas/saídas e alertas de estoque baixo |
| Gestão da Frota   | CRUD de veículos (5 inicialmente, com previsão de crescimento)            |
| Gestão de Clientes| Clientes PF (CPF, CNH) e PJ (CNPJ, responsável)                          |
| Templates         | CRUD de templates de documentos com variáveis. Geração de PDF             |
| Relatórios        | Receita por período, por módulo, ticket médio, ocupação da frota          |

### Regras Importantes

- Serviços desativados preservam referências no histórico de atendimentos.
- Veículos em status `alugado` ou `manutenção` não aparecem como disponíveis para reserva.
- Templates usam variáveis dinâmicas (`{{cliente.nome}}`, `{{veiculo.placa}}`, etc.) e geram PDF.
- Relatórios exportáveis em CSV e PDF.
- Produtos do estoque podem ser vinculados a serviços (relação N:N com quantidade por uso).
- Alertas de estoque baixo exibidos no dashboard quando `quantidadeAtual <= estoqueMinimo`.
- Movimentações de estoque registram: tipo (ENTRADA/SAIDA/AJUSTE), quantidade, motivo e quem fez.

---

## Módulo: RCar Lavajato

### Fluxo de Agendamento Online

```
Cliente acessa portal → Seleciona serviço(s) → Escolhe data/hora disponível
→ Identifica-se (login ou avulso) → Confirma → Recebe confirmação por e-mail
```

### Fluxo de Atendimento Presencial (Fila)

```
Cliente chega → Operador adiciona à fila (avulso ou cadastrado)
→ Serviço + placa registrados → Status: aguardando → em atendimento → concluído
→ Pagamento registrado (método) → Recibo gerado via template
```

### Regras Importantes

- A lista de serviços é dinâmica e gerenciada pelo Admin.
- Serviço inicial: _Lavagem Simples_.
- Horários disponíveis calculados pela duração do serviço + slots configuráveis.
- Cancelamento permitido com antecedência configurável (ex: 2h antes).
- Pagamento apenas **registrado** no sistema (não processado online por enquanto).
- Métodos aceitos: dinheiro, Pix, cartão crédito/débito.

---

## Módulo: RCar Renting

### Fluxo de Reserva Online

```
Cliente acessa portal → Seleciona categoria → Define período (retirada/devolução)
→ Vê valor estimado → Upload de CNH (se novo) → Confirma reserva → E-mail automático
```

### Fluxo de Abertura de Contrato

```
Operador vincula reserva a veículo → Vistoria de saída (checklist + fotos + combustível)
→ Registra caução e seguro → Gera contrato PDF via template
→ Assinatura digital (integração D4Sign) → Contrato ativo
```

### Fluxo de Devolução

```
Cliente devolve → Vistoria de chegada (checklist + fotos)
→ Comparativo entrada vs. saída → Cobrança de extras (se houver)
→ Liberação de caução → Veículo volta para status 'disponível'
```

### Regras Importantes

- Frota inicial: 5 veículos. Estrutura preparada para crescimento.
- Modalidades: diária, semanal, mensal.
- Caução e seguro registrados no contrato (cobrança futura via Pagar.me).
- Documentos obrigatórios para locação PF: CNH válida.
- Documentos obrigatórios para locação PJ: contrato social + CNH do condutor.
- Alertas de devolução: D-1, no dia, atrasado.
- Extensão de prazo deve ser registrada com novo valor calculado.
- Ocorrências (sinistro, multa, avaria) vinculadas ao contrato.

---

## Integrações Externas

| Serviço    | Finalidade                                      | Fase       |
|------------|-------------------------------------------------|------------|
| Pagar.me   | Gateway de pagamento (Pix, cartão, boleto)      | Fase 2     |
| D4Sign     | Assinatura digital de contratos com validade jurídica | Fase 1 |
| SMTP/SES   | Envio de e-mails (confirmações, lembretes)      | Fase 1     |
| WhatsApp API| Notificações (lembrete devolução, status fila) | Fase 3     |

---

## Regras Transversais

- Todo registro financeiro deve conter: valor, método, data, referência (lavagem ou aluguel) e **quem registrou** (usuário operador/gestor responsável).
- Histórico de ações críticas (login, criação de contrato, alteração de status, **criação/edição de serviços e seus detalhes**) deve ser logado com identificação do usuário, timestamp e snapshot dos dados alterados.
- Dados sensíveis (CNH, documentos) armazenados com acesso restrito (S3 privado com URLs assinadas).
- O sistema deve funcionar 100% web, sem necessidade de instalação nativa.


