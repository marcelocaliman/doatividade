# Doatividade — Visão do Projeto

> Este documento é a fonte da verdade sobre o produto, decisões estratégicas e contexto de negócio. Deve ser anexado ao Project Knowledge no Claude.ai pra que o Claude tenha contexto completo em toda nova conversa.

## O que é

**Doatividade** é uma plataforma brasileira de doações online (vaquinha/crowdfunding) onde pessoas físicas e organizações criam campanhas de arrecadação e recebem doações via Pix e cartão de crédito.

O nome é a junção de "doação" + "atividade".

## Posicionamento

> **A menor taxa do Brasil pra doações via Pix. Sua campanha no ar em 5 minutos.**

Diferenciais centrais:
- **Taxa competitiva no Pix** (~3,99% total vs 6,4%+ do Vakinha)
- **Onboarding ultra-rápido** (5 passos até receber a primeira doação)
- **Sem taxa de saque** (Vakinha cobra R$ 5/saque)
- **UX e visual modernos** (concorrentes têm UX dos anos 2010)
- **Página de campanha bonita e rápida** (SSR, Open Graph dinâmico)

## Público-alvo

Pessoas físicas e organizações com mesmo peso:
- **PF**: causas pessoais, emergências médicas, ajuda a famílias
- **ONGs**: arrecadação contínua, projetos sociais
- **Criadores/projetos**: arrecadações pontuais para iniciativas

## Modelo de negócio

**Receita**: application fee sobre cada doação processada (split payment via Stripe Connect).

**Estrutura de taxas**:

| Método | Stripe cobra | Doatividade cobra | Total efetivo |
|---|---|---|---|
| Pix | 1,19% | 2,8% | **3,99%** |
| Cartão crédito | 3,99% + R$ 0,39 | 3% | **6,99% + R$ 0,39** |

**Modelo "doador cobre as taxas"** (estilo GoFundMe):
- Por padrão, na tela de doação aparece toggle "cobrir taxas para a campanha receber valor integral"
- Quando ativo: criador recebe valor cheio, doador paga doação + taxas
- Quando inativo: taxas são debitadas do valor doado

**Importante**: dinheiro NUNCA passa pela conta da Doatividade. Direct Charge via Stripe Connect garante que a doação vai direto pra subconta do criador, e a taxa da plataforma cai automaticamente na conta principal Stripe da Doatividade.

## Stack técnica

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Auth**: Supabase Auth com Google Sign-In
- **Pagamentos**: Stripe Connect Standard + Embedded Onboarding + Embedded Components
- **Modelo de cobrança**: Direct Charge com `application_fee_amount`
- **Email transacional**: Resend
- **Hosting**: Vercel
- **Repo**: GitHub
- **IDE/AI**: VS Code + Claude Code

## Decisões estratégicas tomadas

1. **Stripe Connect Standard (não Express ou Custom)** — compliance fica todo no Stripe, criador tem dashboard próprio se quiser, menor fricção legal pra Doatividade. Trade-off: alguns elementos têm branding Stripe inevitável (mitigado com Embedded Components).

2. **Embedded Onboarding (não Hosted)** — usuário não sai do app, experiência fluida. Tema customizado pra parecer nativo (mesma cor primária, fonte, border radius).

3. **Direct Charge com application_fee_amount** — dinheiro vai direto pro criador, Doatividade só recebe a taxa. Implicações: criador é o "merchant of record", chargebacks vão pra ele, Doatividade fica protegida.

4. **Lançamento com cartão primeiro (sem Pix no MVP)** — Stripe Pix é invite-only e exige histórico de processamento de 60+ dias. Plano: lançar com cartão, processar volume, pedir liberação do Pix, ativar quando aprovado.

5. **Lançamento público aberto (sem whitelist)** — máxima velocidade de adoção. Mitigações obrigatórias: review automático, limite inicial de meta (R$ 10k), botão denúncia, hash perceptual de imagens, termos fortes.

6. **Empresa: PJ (não PF, não MEI)** — usuário já tem CNPJ de empresa existente. Stripe será criado como `business_type: company`. Stripe Brasil NÃO permite trocar PF↔PJ depois — decidir certo desde o início é crítico.

## Fluxo do criador (5 passos até receber doação)

1. Landing → "Criar campanha" → Sign-in com Google
2. Tela única de criação de campanha (título, foto, descrição, meta, data fim)
3. KYC mínimo via Embedded Onboarding com tema Doatividade (CPF, data nasc, endereço) — `charges_enabled = true`
4. Campanha publicada → link compartilhável + QR Code
5. KYC completo (selfie + documento) só quando clicar em "Sacar" pela primeira vez

## Fluxo do doador

1. Acessa página da campanha via link/QR/busca
2. Vê barra de progresso, descrição, doadores, etc.
3. Clica "Doar agora"
4. Escolhe valor (pills pré-definidas ou custom)
5. Toggle "cobrir taxas" (default: ligado)
6. Preenche nome, email, mensagem opcional, anonimato opcional
7. Pagamento via Stripe Payment Element (cartão/Pix)
8. Confirmação + recibo automático
9. Doação aparece em tempo real na página

## Página da campanha (coração do produto)

Elementos por ordem de importância:
1. Banner + título + criador + badge verificado
2. Barra de progresso animada (R$ atual / meta)
3. Contador dias restantes + número de doadores
4. CTA "Doar agora" sticky
5. Pills de valor (R$ 25 / R$ 50 / R$ 100 / R$ 250 / Outro)
6. Toggle doação recorrente (pra ONGs)
7. Descrição completa (markdown)
8. Galeria de fotos
9. Atualizações da campanha (timeline)
10. Lista de doadores recentes em tempo real (Supabase Realtime)
11. Compartilhamento (WhatsApp em destaque, Insta Stories, X, copiar link)
12. QR Code da campanha
13. Botão "Denunciar" discreto no rodapé

**SEO crítico**: SSR + Open Graph dinâmico (imagem gerada com foto da campanha + barra de progresso + R$ atual). Quando alguém compartilha no WhatsApp, aparece bonito e atualizado.

## Status atual do projeto

**Fase**: Pré-desenvolvimento — setup de contas e documentação.

**Próximos passos imediatos**:
1. Criar Gmail mestre do projeto
2. Criar conta GitHub
3. Criar conta Vercel (login via GitHub)
4. Criar conta Supabase (login via GitHub)
5. Criar conta Stripe (sandbox primeiro, conta real em paralelo)
6. Iniciar desenvolvimento com Claude Code no VS Code

**Decisão**: começar tudo em **Stripe Sandbox** pra desbloquear desenvolvimento sem esperar aprovação da conta real. Migrar pra produção apenas trocando variáveis de ambiente quando MVP estiver pronto.

## Concorrência (referência)

| Plataforma | Taxa | Observações |
|---|---|---|
| Vakinha | 6,4% + R$ 0,50 + R$ 5/saque | Líder, UX antiga |
| Benfeitoria | 4,5% + tip "voluntário" | Crowdfunding cultural |
| Kickante / Abacashi | 6% | Crowdfunding |
| Catarse | 13% | Cultura, alta taxa |
| GoFundMe | 0% plataforma + taxas pagamento | Modelo "doador cobre" |

## Restrições e regras de negócio

- **Idioma**: pt-BR único
- **Moeda**: BRL único
- **País**: Brasil único (criadores e doadores)
- **Categorias iniciais**: Saúde, Educação, Animais, Social, Emergência, Religião, Outros
- **Conteúdo proibido**: político-partidário, religioso extremista, ilegal, fraudulento
- **Termos de uso**: Doatividade é plataforma de tecnologia, não responde por veracidade das campanhas
- **LGPD**: dados de doadores protegidos, exibição pública só com consentimento (anônimo opcional)
- **Idade mínima**: 18 anos pra criar campanha (conforme requisito Stripe)

## Riscos identificados

1. **Pix invite-only no Stripe**: bloqueador parcial do MVP, mitigado lançando com cartão
2. **Fraude em lançamento aberto**: mitigado com review automático, limites e denúncias
3. **Dependência total do Stripe**: se Stripe suspender conta plataforma, app para. Mitigação futura: arquitetura preparada pra adicionar segundo PSP (Asaas/Pagar.me)
4. **Chargebacks**: mitigado pelo Direct Charge (problema do criador, não da plataforma) mas ainda afeta reputação Stripe
5. **Concorrência estabelecida**: Vakinha é forte, mas UX ruim e taxas altas abrem espaço

## Brand & UI guidelines

- **Tom**: caloroso, direto, sem firula, transparente sobre taxas
- **Cor primária sugerida**: verde (#10b981) — generosidade, crescimento, confiança
- **Tipografia**: Inter ou Geist (gratuitas, modernas, legíveis)
- **Princípios visuais**: espaçamento generoso, hierarquia tipográfica clara, componentes minimalistas (inspirado no Stripe pra manter coerência com Embedded Components)
- **Iconografia**: lucide-react
