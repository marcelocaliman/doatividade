# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Doatividade** é uma plataforma brasileira de doações online (vaquinha) onde pessoas físicas e organizações criam campanhas de arrecadação. Usa Stripe Connect Standard com Direct Charge: o dinheiro vai direto pra subconta do criador e a plataforma recebe `application_fee_amount` automaticamente.

Para contexto completo de produto, ler `docs/architecture.md` e `docs/pricing.md`.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Auth**: Supabase Auth com Google OAuth
- **Payments**: Stripe Connect Standard + Embedded Onboarding + Embedded Components
- **Email**: Resend
- **Hosting**: Vercel
- **Package manager**: pnpm

## Commands

```bash
# Development
pnpm dev                    # Start dev server on localhost:3000
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check

# Supabase
pnpm supabase start         # Start local Supabase (requires Docker)
pnpm supabase db push       # Apply migrations to remote
pnpm supabase db reset      # Reset local DB
pnpm supabase gen types typescript --project-id <id> > types/database.ts

# Stripe (local webhook testing)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe listen --forward-connect-to localhost:3000/api/stripe/webhook-connect
```

## Project Structure

```
app/
├── (marketing)/          # Public marketing pages (landing, pricing, etc)
├── (app)/                # Authenticated app pages (dashboard, create campaign)
├── (campaign)/           # Public campaign pages (/c/[slug])
├── api/                  # API routes (stripe, og, webhooks)
├── auth/                 # Auth callbacks
└── layout.tsx            # Root layout

components/
├── ui/                   # shadcn primitives (don't edit by hand, use CLI)
├── campaign/             # Campaign-specific components
├── stripe/               # Stripe Embedded Components wrappers
└── shared/               # Reusable cross-feature components

lib/
├── supabase/             # Supabase clients (browser, server, service)
├── stripe/               # Stripe SDK wrappers, fee calculations, helpers
└── utils.ts              # Misc helpers

types/
└── database.ts           # Auto-generated from Supabase

docs/                     # Project documentation (read these first)
```

## Critical Rules

### Money & Stripe

- **NEVER store money in floats**. Always use cents (`bigint` em SQL, `number` em TS representando centavos).
- **NEVER let money pass through Doatividade's account**. Always use Direct Charge with `application_fee_amount` and `stripeAccount` parameter.
- **NEVER expose `STRIPE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`** no client. Server-only.
- **Webhook signature MUST be verified** em todo endpoint que recebe webhook. Sem isso, qualquer um pode injetar eventos falsos.
- **Idempotência**: usar `stripe_payment_intent_id` como unique key em donations pra prevenir duplicação se webhook for reentregue.
- **Toda chamada Stripe que envolve subconta DEVE passar `{ stripeAccount: accountId }`** como segundo parâmetro. Sem isso, vai pra conta plataforma e quebra o modelo.

### Database (Supabase)

- **Sempre habilitar RLS** em toda tabela nova. Nada de tabela pública sem policy.
- **Nunca usar `service_role` key no client**. Só em API routes server-side e webhooks.
- **Migrations são versionadas** em `supabase/migrations/`. Toda mudança de schema vira migration, nunca edita direto na UI do Supabase.
- **Triggers pra contadores**: usar Postgres triggers pra manter `current_amount_cents` e `donor_count` consistentes, não calcular no app.

### Code Quality

- **TypeScript strict mode**. Sem `any` exceto se absolutamente necessário (e comentado o porquê).
- **Validação de input**: usar Zod em toda rota API e Server Action.
- **Error handling**: nunca engolir erro silenciosamente. Logar com contexto suficiente pra debug.
- **Naming**: components em PascalCase, functions em camelCase, files em kebab-case (exceto components React em PascalCase).

### Security

- **Nunca commitar `.env*`**. Já está no `.gitignore`.
- **Toda input do usuário é hostil**: sanitizar HTML em descrições de campanha (usar `DOMPurify` no markdown rendering).
- **Rate limiting** em endpoints sensíveis (criar campanha, criar payment intent): usar Vercel Edge Config ou Upstash.
- **CORS**: API routes só aceitam requests do próprio domínio (Next.js já faz isso por padrão pra App Router).

### UX

- **Mobile-first**: todo componente projetado pra mobile primeiro, depois adapta pra desktop.
- **Loading states obrigatórios**: nada de tela em branco enquanto carrega. Skeleton screens preferíveis a spinners.
- **Erros user-friendly**: mensagem em português claro. Nunca expor stack trace ou erro técnico.
- **Acessibilidade**: usar shadcn (já vem acessível), labels em todos inputs, alt em imagens.

## Important Patterns

### Criação de subconta Stripe

Sempre `business_type: 'company'` se `account_type === 'organization'`, senão `'individual'`. País sempre `'BR'`. MCC sempre `'8398'` (Charitable and Social Service Organizations).

### Embedded Onboarding tema

O tema do componente Stripe DEVE bater com o tema do app: mesma `colorPrimary`, `fontFamily`, `borderRadius`, `spacingUnit`. Definir essas variáveis em `lib/stripe/appearance.ts` e reusar em todos os Embedded Components.

### Direct Charge

Toda criação de PaymentIntent pra doação:
```ts
stripe.paymentIntents.create(
  { amount, application_fee_amount, /* ... */ },
  { stripeAccount: accountId }  // <-- crítico
);
```

E no client, ao carregar Stripe.js:
```ts
loadStripe(publishableKey, { stripeAccount: accountId });
```

### Webhooks

Dois endpoints separados:
- `/api/stripe/webhook` → eventos da conta plataforma (account.updated)
- `/api/stripe/webhook-connect` → eventos de subcontas (payment_intent.*)

Cada um valida assinatura com seu próprio `WEBHOOK_SECRET`.

### RLS Policies

Padrão geral:
- `select` público em campanhas com status `active` ou `completed`
- `select`/`insert`/`update`/`delete` no próprio recurso pelo dono (`auth.uid() = user_id`)
- Doações: leitura pública via view `donations_public` (sem email/dados sensíveis)
- Webhooks usam `service_role` pra bypassar RLS (server-side only)

## Environment Variables

Ver `.env.example` na raiz pra lista completa. Crítico:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` (server only)
- `STRIPE_WEBHOOK_SECRET` (server only)
- `STRIPE_CONNECT_WEBHOOK_SECRET` (server only)
- `RESEND_API_KEY` (server only)
- `NEXT_PUBLIC_APP_URL`

## Workflow

### Adicionando feature nova

1. Ler `docs/architecture.md` e docs relevantes pra entender contexto
2. Confirmar que não quebra `docs/database.md` schema (se quebrar, atualizar e criar migration)
3. Implementar com testes manuais documentados
4. Atualizar docs se mudou algo arquitetural
5. Commit com mensagem descritiva (formato: `feat:`, `fix:`, `chore:`, `docs:`)

### Mudando schema do banco

1. Criar nova migration em `supabase/migrations/`
2. Aplicar localmente com `pnpm supabase db reset`
3. Regenerar tipos com `pnpm supabase gen types`
4. Atualizar `docs/database.md`
5. Aplicar em produção quando merge na main: `pnpm supabase db push`

### Testando Stripe

Sempre em **Test mode** durante desenvolvimento. Cartões de teste:
- Sucesso: `4242 4242 4242 4242`
- Falha (insufficient funds): `4000 0000 0000 9995`
- Requires authentication: `4000 0025 0000 3155`

Pra testar webhooks localmente, rodar `stripe listen` em terminal separado e copiar o `whsec_...` pra `STRIPE_WEBHOOK_SECRET`.

## Things NOT to do

- Não criar Server Components que fazem fetch direto no Stripe sem cache. Usa Supabase como source of truth e atualiza via webhook.
- Não fazer cálculo de taxa no client. Sempre server-side via `lib/stripe/fees.ts`.
- Não permitir publicar campanha sem `stripe_charges_enabled: true` no profile do criador.
- Não usar `useEffect` pra fetch de dados quando dá pra fazer Server Component.
- Não criar componentes shadcn manualmente. Usar `pnpm dlx shadcn@latest add <component>`.
- Não fazer commit direto na `main`. Sempre branch + PR (mesmo solo, pra ter histórico claro).
- Não esquecer de atualizar `current_amount_cents` via trigger (não no app code).
- Não ignorar warnings do TypeScript. Resolver, não suprimir.

## Reference Documents

Quando precisar de detalhes específicos, consultar:

- `docs/architecture.md` — arquitetura geral, stack, fluxos
- `docs/database.md` — schema completo, RLS, triggers
- `docs/stripe-integration.md` — Connect, Direct Charge, webhooks, Embedded Components
- `docs/pricing.md` — modelo de taxas, cálculos, exemplos
- `docs/roadmap.md` — fases MVP/V1/V2, prioridades
- `docs/security.md` — checklist de segurança e LGPD
- `doatividade-overview.md` — visão de produto e decisões estratégicas

## Convenções aprendidas durante a implementação

### Stripe Connect Standard usa Hosted Onboarding, não Embedded

Apesar do nome, `ConnectAccountOnboarding` para Standard é só um "launcher" que abre popup. Pra UX contínua usamos **Account Links + redirect cheio**. Implementação em `lib/stripe/actions.ts:createOnboardingLink`. Embedded só pra Balances/Payouts/Payments em `/conta`.

### `display: flex` em TODOS containers do `next/og`

Satori (engine do `@vercel/og`) exige `display: flex` em qualquer container com múltiplos children — incluindo divs com texto puro. Sem isso dá `Invalid source map / failed to pipe response`. Ver `app/api/og/[slug]/route.tsx`.

### Next.js 16: `redirect()` dentro de stream pode quebrar

`redirect()` dentro de `try/catch` em Server Component dispara `controller[kState].transformAlgorithm is not a function`. Workaround: retornar estrutura tipada (ex: `checkAdmin()` em `lib/auth/admin.ts`) e renderizar condicionalmente em vez de redirecionar.

### shadcn/ui usa base-ui (não Radix)

Versão atual do shadcn não tem `asChild`. Use `buttonVariants()` + className em `<Link>`. `Accordion` dispensa `type="single" collapsible`. `Dialog.Trigger` recebe `className` direto, não wrap.

### Rate limit barato via SQL count

Tabela `rate_limit_events` + count na janela. Sem cache externo. Funciona até alto volume; quando sobrar tempo, trocar por Upstash. Ver `lib/utils/rate-limit.ts`.

### Realtime simples: subscribe + `router.refresh()`

Em vez de manter cache otimista no client, `CampaignRealtime` subscribe a Postgres changes e dispara `router.refresh()` com debounce de 500ms. Next refaz SSR e re-hidrata só o que mudou. Suficiente pro volume MVP.

### Não rodar `rm -rf .next` com dev server ativo

Corrompe o cache do Turbopack e gera 500 em loop. Sempre `kill <pid>` primeiro.

### Migrations idempotentes via Management API

Como o CLI Supabase pode estar logado em conta diferente, aplicar migrations via:
```bash
SQL=$(jq -Rs . < supabase/migrations/XXX.sql)
curl -X POST "https://api.supabase.com/v1/projects/<ref>/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SQL}"
```
Sempre escrever migrations com `create table if not exists`, `drop policy if exists`, etc.

### `SUPABASE_ACCESS_TOKEN` no `.env.local`

Permite gerenciar o projeto via Management API sem `supabase link`. Ver `lib/supabase/service.ts`.
