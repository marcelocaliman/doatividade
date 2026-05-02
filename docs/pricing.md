# Pricing — Modelo de Taxas

## Estrutura

| Método | Stripe cobra | Doatividade cobra | Total efetivo |
|---|---|---|---|
| Pix | 1,19% | 2,8% | **3,99%** |
| Cartão de crédito | 3,99% + R$ 0,39 | 3,0% | **6,99% + R$ 0,39** |

Sem taxa de saque. Sem mensalidade. Sem taxa de criação de campanha. Sem quarentena.

## Modelo "doador cobre as taxas"

Inspirado no GoFundMe atual. Por padrão (default ON), na tela de doação aparece:

```
Sua doação:           R$ 100,00
[✓] Cobrir taxas para a campanha receber valor integral (+R$ 4,17)

Total:                R$ 104,17
A campanha recebe:    R$ 100,00
```

Se desmarcar:

```
Sua doação:           R$ 100,00
[ ] Cobrir taxas

Total:                R$ 100,00
A campanha recebe:    R$ 96,01 (Pix) ou R$ 95,62 (Cartão)
```

**Por que isso importa:**
- 60-70% dos doadores escolhem cobrir (dado público GoFundMe)
- Criador vê valor cheio na barra de progresso (mais motivador)
- Reduz reclamação de criador "minha doação foi R$ 100 mas só chegou R$ 95"
- Aumenta receita efetiva da plataforma sem aumentar taxa percebida

## Cálculos detalhados

### Cenário 1: Pix R$ 100, doador cobre

Premissa: criador deve receber R$ 100 líquidos.

```
total * (1 - 0.0119 - 0.028) = 100
total * 0.9601 = 100
total = 100 / 0.9601
total = R$ 104,16
```

Em centavos:
- `totalCharged` = 10417 (R$ 104,17 — arredondado pra cima)
- `stripeFee` = round(10417 × 0.0119) = 124 (R$ 1,24)
- `applicationFee` = round(10417 × 0.028) = 292 (R$ 2,92)
- `netToCreator` = 10417 - 124 - 292 = 10001 (R$ 100,01 — sobra um centavo do arredondamento)

### Cenário 2: Pix R$ 100, criador absorve

Premissa: doador paga R$ 100, taxas saem disso.

- `totalCharged` = 10000 (R$ 100,00)
- `stripeFee` = round(10000 × 0.0119) = 119 (R$ 1,19)
- `applicationFee` = round(10000 × 0.028) = 280 (R$ 2,80)
- `netToCreator` = 10000 - 119 - 280 = 9601 (R$ 96,01)

### Cenário 3: Cartão R$ 100, doador cobre

Premissa: criador deve receber R$ 100 líquidos.

```
total * (1 - 0.0399 - 0.03) - 0.39 = 100
total * 0.9301 = 100.39
total = 100.39 / 0.9301
total = R$ 107,93
```

Em centavos:
- `totalCharged` = 10793
- `stripeFee` = round(10793 × 0.0399) + 39 = 431 + 39 = 470 (R$ 4,70)
- `applicationFee` = round(10793 × 0.03) = 324 (R$ 3,24)
- `netToCreator` = 10793 - 470 - 324 = 9999 (R$ 99,99)

### Cenário 4: Cartão R$ 100, criador absorve

- `totalCharged` = 10000
- `stripeFee` = round(10000 × 0.0399) + 39 = 399 + 39 = 438 (R$ 4,38)
- `applicationFee` = round(10000 × 0.03) = 300 (R$ 3,00)
- `netToCreator` = 10000 - 438 - 300 = 9262 (R$ 92,62)

## Comparativo com concorrência

Cenário: campanha arrecada R$ 10.000 em doações de R$ 100 cada (100 doações).

### Vakinha (6,4% + R$ 0,50/doação + R$ 5/saque)

```
Doações brutas:        R$ 10.000,00
Taxa percentual:       R$ 640,00 (6,4%)
Taxa fixa por doação:  R$ 50,00 (100 × R$ 0,50)
Taxa de saque:         R$ 5,00 (1 saque)
─────────────────────────────────────
Criador recebe:        R$ 9.305,00
Taxa efetiva:          ~6,95%
```

### Doatividade Pix, criador absorve

```
Doações brutas:        R$ 10.000,00
Stripe (1,19%):        R$ 119,00
Doatividade (2,8%):    R$ 280,00
Saque:                 R$ 0,00
─────────────────────────────────────
Criador recebe:        R$ 9.601,00
Taxa efetiva:          ~3,99%
```

**Economia vs Vakinha**: R$ 296,00 (~43% menos taxas)

### Doatividade Pix, doador cobre

```
Doações brutas (cobrado): R$ 10.416,68 (doadores pagam mais)
Stripe (1,19%):           R$ 123,96
Doatividade (2,8%):       R$ 291,67
─────────────────────────────────────
Criador recebe:           R$ 10.001,05 (~valor cheio)
Taxa efetiva pro doador:  ~4,17%
```

### Doatividade Cartão, criador absorve

```
Doações brutas:        R$ 10.000,00
Stripe (3,99% + R$ 0,39): R$ 438,00 (399 + 39 — assumindo 1 cobrança)
Doatividade (3%):      R$ 300,00
─────────────────────────────────────
Criador recebe:        R$ 9.262,00
Taxa efetiva:          ~7,38%
```

Note: cartão fica próximo do Vakinha. **O diferencial real está no Pix.**

## Por que essa estrutura

### Por que Pix tem taxa menor?

Custo Stripe pro Pix é 1,19% (vs 3,99% + R$ 0,39 cartão). Repassamos parte da economia: cobramos 2,8% no Pix vs 3% no cartão. Isso incentiva doadores a usar Pix (melhor pra plataforma) e pra criador (recebe mais).

### Por que doador-cobre como default?

- Aumenta valor recebido pelo criador → criador feliz
- Aumenta receita efetiva da plataforma (taxa sobre valor maior)
- É o padrão do GoFundMe → doadores já estão familiarizados
- Doador escolhe livremente → sem fricção ética

### Por que sem taxa de saque?

- Vakinha cobra R$ 5/saque → desincentiva saques pequenos/frequentes
- Stripe não cobra saque pra contas brasileiras (payouts gratuitos)
- Diferencial competitivo direto

## Comunicação ao usuário

### Na landing

```
Pix: 3,99%
Cartão: 6,99% + R$ 0,39

Sem mensalidade. Sem taxa de saque. Sem pegadinhas.
```

### Na criação de campanha

Mensagem leve no formulário:

> "💡 Sua campanha é gratuita pra criar. Cobramos 3,99% por doação via Pix (a menor taxa do Brasil) e 6,99% + R$ 0,39 via cartão. Sem mensalidade, sem taxa de saque."

### Na tela de doação

Toggle visível:

```
[✓] Cobrir taxas para que Maria receba o valor integral (+R$ 4,17)
```

Tooltip ou link "como calculamos?" abre modal com breakdown.

### No FAQ

Pergunta dedicada:
> **Quanto custa usar a Doatividade?**
> 
> Cobramos uma taxa por doação que varia conforme o método:
> - **Pix**: 3,99% (1,19% Stripe + 2,8% Doatividade)
> - **Cartão de crédito**: 6,99% + R$ 0,39
> 
> Não cobramos mensalidade, taxa de criação ou taxa de saque. As taxas só incidem quando você efetivamente recebe doações.
> 
> Pra reduzir o impacto, oferecemos a opção do doador cobrir as taxas — assim sua campanha recebe o valor integral.

## Margem de manobra

Se precisar reduzir taxa em algum momento (estratégia de aquisição, parceria, ONG verificada):

- **Mínimo viável Pix**: 1,19% Stripe + 0,5% nossa = 1,69% — cobre só infraestrutura
- **Mínimo viável Cartão**: 3,99% + R$ 0,39 + 1% = 4,99% + R$ 0,39 — idem

Abaixo disso, plataforma não cobre custos operacionais (Vercel, Supabase, suporte, time).

## Modelos alternativos considerados (e descartados)

### "Tip jar" (Benfeitoria)

Doador escolhe contribuir voluntariamente pra plataforma além da doação. **Descartado** porque:
- Imprevisível pra modelagem financeira
- Difícil explicar pro usuário
- Concorrência direta (Vakinha) usa modelo simples

### Taxa única "tudo incluso"

Cobrar 5% pra qualquer método e absorver diferença Stripe internamente. **Descartado** porque:
- Cartão fica deficitário (4,38% Stripe + R$ 0,39 vs 5%)
- Esconde verdadeira estrutura de custos
- Não escala se mix mudar pra mais cartão

### Tier gratuito + paid pro features

Plataforma grátis, cobrar por features extras (banner destacado, analytics avançado). **Descartado pra MVP** porque:
- Complica o modelo
- Sem dados de uso, não dá pra precificar features
- Pode evoluir pra isso na V2 se fizer sentido
