# Doatividade

> Plataforma brasileira de doações com a menor taxa do mercado. Sua campanha no ar em 5 minutos.

## Sobre

Doatividade é uma plataforma de vaquinha online focada em três coisas: **taxa baixa** (3,99% Pix), **onboarding rápido** e **UX moderna**. Construída em Next.js + Supabase + Stripe Connect, usando Direct Charge para que o dinheiro vá direto pro criador da campanha sem passar pela plataforma.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui (base-ui)
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Auth**: Supabase Auth com Google OAuth
- **Pagamentos**: Stripe Connect Standard com Direct Charge + `application_fee_amount`
- **Onboarding KYC**: Stripe Hosted Onboarding (Account Links) — redirect cheio em vez de popup
- **Embedded Components** (Balances, Payouts, Payments) na página da conta
- **Emails**: Resend + react-email
- **Observabilidade**: Vercel Analytics, Speed Insights, Sentry (opcional)
- **Hosting**: Vercel
- **Testes**: Vitest (cobertura focada em `lib/stripe/fees.ts`)

## Getting started — local

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar env
cp .env.example .env.local
# preencher .env.local — ver seção "Variáveis de ambiente" abaixo

# 3. Rodar migrations no Supabase remoto
# (CLI está logado em outra conta? aplica via Management API:
#  ver lib/supabase/service.ts pra padrão. As migrations em
#  supabase/migrations/*.sql são idempotentes.)

# 4. Subir dev server
pnpm dev

# 5. Em outros terminais, escutar webhooks Stripe (test mode)
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe listen --forward-connect-to localhost:3000/api/stripe/webhook-connect
# Cole os whsec_... que aparecem no .env.local
```

Acesse http://localhost:3000.

## Variáveis de ambiente

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only — nunca exponha
SUPABASE_ACCESS_TOKEN=              # PAT pra Management API (opcional, dev)

# === Stripe ===
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                  # server-only
STRIPE_WEBHOOK_SECRET=              # de stripe listen --forward-to .../webhook
STRIPE_CONNECT_WEBHOOK_SECRET=      # de stripe listen --forward-connect-to .../webhook-connect

# === Email ===
RESEND_API_KEY=                     # opcional em dev (sem ela, emails são logados)
RESEND_FROM_EMAIL="Doatividade <noreply@doatividade.com.br>"

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === Antifraude / admin ===
ADMIN_EMAILS=                       # csv de emails permitidos em /admin
ADMIN_EMAIL=                        # destinatário das notificações de denúncia
CRON_SECRET=                        # bearer secret pros cron handlers

# === Observabilidade (opcional) ===
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
```

## Scripts

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm start        # production server
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run (testes de fees)
```

## Documentação

- [CLAUDE.md](CLAUDE.md) — guia operacional pra Claude Code
- [docs/architecture.md](docs/architecture.md) — arquitetura geral, fluxos
- [docs/database.md](docs/database.md) — schema, RLS, triggers
- [docs/stripe-integration.md](docs/stripe-integration.md) — Connect, Direct Charge, webhooks
- [docs/pricing.md](docs/pricing.md) — modelo de taxas, cálculos
- [docs/roadmap.md](docs/roadmap.md) — fases MVP / V1 / V2
- [docs/security.md](docs/security.md) — checklist de segurança e LGPD
- [docs/product-overview.md](docs/product-overview.md) — visão de produto

## Estrutura

```
app/
├── (marketing)/          # landing + páginas institucionais
├── (app)/                # área autenticada (dashboard, conta, criar/editar campanha)
├── (campaign)/           # páginas públicas de campanha (/c/[slug])
├── admin/                # painel admin (gated por ADMIN_EMAILS)
├── api/
│   ├── cron/             # rotas de cron (Vercel Cron Jobs declaradas em vercel.json)
│   ├── og/[slug]/        # OG image dinâmica
│   ├── stripe/           # webhooks + helpers
│   └── dashboard/        # CSV export
├── auth/                 # OAuth callback + login
└── onboarding/stripe/    # KYC do criador (hosted via Account Links)

components/
├── brand/                # Logo
├── campaign/             # CampaignView, BannerUploader, GalleryManager, etc
├── donation/             # DonationFlow, PaymentElement
├── stripe/               # AccountFinancialDashboard, KycAdditionalBanner
└── ui/                   # shadcn primitives (não editar)

lib/
├── supabase/             # clients (server/browser/proxy/service)
├── stripe/               # SDK wrapper + fees calculator + actions
├── campaigns/            # server actions de campanhas
├── donations/            # server actions de doações
├── reports/              # denúncias
├── admin/                # ações administrativas
├── email/                # senders + templates react-email
├── utils/                # helpers (slug, format, similarity, rate-limit)
└── validation/           # Zod schemas
```

## Webhooks

Dois endpoints (validação de assinatura obrigatória):
- **`/api/stripe/webhook`** — eventos da plataforma: `account.updated`, `account.application.deauthorized`
- **`/api/stripe/webhook-connect`** — eventos das subcontas: `payment_intent.*`, `charge.refunded`, `charge.dispute.created`, `payout.paid`, `payout.failed`

## Crons

Declarados em `vercel.json` (Vercel injeta `Authorization: Bearer ${CRON_SECRET}` automaticamente):
- **`/api/cron/promote-pending-campaigns`** — horário, promove `pending_review` >24h sem flags
- **`/api/cron/monitor-volume`** — diário, loga campanhas com spike (>100 doações succeeded em 1h)

## Padrões críticos

- **Money sempre em centavos** (`bigint` no SQL, `number` int no TS). Sem floats.
- **Direct Charge sempre**: `stripe.paymentIntents.create({...}, { stripeAccount })`. Dinheiro nunca passa pela plataforma.
- **Webhook signature obrigatória** com `stripe.webhooks.constructEvent`.
- **Idempotência via `stripe_payment_intent_id`** unique em `donations`.
- **RLS habilitado** em toda tabela. `service_role` só em webhooks/jobs.
- **Validação Zod** em toda Server Action que recebe input.

## Status

✅ MVP completo — auth, campanhas, doações via cartão, webhooks, antifraude básico, realtime, painel admin, OG dinâmico, emails react-email, financial dashboard embedded.

🚧 Pré-lançamento — falta config de webhooks de produção no Stripe Dashboard, ativação do live mode, domínio próprio.

⏳ Backlog (ver [docs/roadmap.md](docs/roadmap.md)) — Pix (depende de aprovação Stripe), notificações in-app, app mobile, multi-PSP.

## Licença

Proprietário — todos os direitos reservados.
