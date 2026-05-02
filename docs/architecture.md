# Arquitetura

## Visão Geral

Doatividade é uma aplicação Next.js full-stack que orquestra três serviços externos: Supabase (dados + auth), Stripe Connect (pagamentos), e Resend (emails). A arquitetura é deliberadamente simples — sem microsserviços, sem filas, sem event bus. Tudo roda dentro do Next.js + Vercel até escala forçar mudança.

```
┌──────────────────┐
│   Browser        │
│   (Next.js)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│  Vercel          │◄───────►│  Supabase        │
│  Next.js App     │         │  Postgres + Auth │
│  - Pages         │         │  + Storage       │
│  - API Routes    │         │  + Realtime      │
│  - Server Actions│         └──────────────────┘
└────────┬─────────┘
         │
         ├───────────────────┐
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│  Stripe Connect  │  │  Resend          │
│  - Subcontas     │  │  - Emails        │
│  - Direct Charge │  │    transacionais │
│  - Webhooks      │  └──────────────────┘
│  - Embedded UI   │
└──────────────────┘
```

## Princípios arquiteturais

1. **Server-first**: dados sempre buscados em Server Components ou Server Actions. `useEffect` pra fetch é exceção.
2. **Source of truth no Supabase**: Stripe é o gateway, mas estado consistente vive no Postgres. Webhooks atualizam Supabase, app lê Supabase.
3. **Direct Charge**: dinheiro nunca passa pela conta plataforma. Stripe debita taxa automaticamente.
4. **Triggers no banco pra invariantes**: contadores (`current_amount_cents`, `donor_count`) atualizados via Postgres triggers, não app code.
5. **Validação dupla**: Zod no edge (rejeitar request inválido cedo) + constraints no Postgres (proteger dados).
6. **Idempotência**: webhooks podem ser reentregues. Toda mutação derivada de webhook usa unique constraint pra deduplicar.

## Fluxo de dados — Criação de Campanha

```
User clica "Criar campanha"
      │
      ▼
Login com Google (Supabase Auth)
      │ trigger handle_new_user() cria public.profiles
      ▼
Página /campanha/criar
      │
      ▼
Form (title, banner, description, goal, end_date)
      │ Server Action createCampaign()
      ▼
1. Upload banner → Supabase Storage
2. INSERT em campaigns (status='draft')
3. Verifica se profile.stripe_account_id existe
   - Se NÃO: redireciona pra /onboarding/stripe
   - Se SIM e charges_enabled: status='pending_review' (24h)
   - Se SIM e !charges_enabled: redireciona pra continuar onboarding
      │
      ▼
Cron job a cada hora promove campanhas pending_review > 24h pra active
```

## Fluxo de dados — Onboarding Stripe

```
Usuário em /onboarding/stripe
      │
      ▼
Server Action getOrCreateStripeAccount()
      │ Se !profile.stripe_account_id:
      │   stripe.accounts.create({ type: 'standard', country: 'BR', ... })
      │   UPDATE profiles SET stripe_account_id = ...
      ▼
Client renderiza <EmbeddedOnboarding accountId={...} />
      │ - loadConnectAndInitialize com appearance custom
      │ - fetchClientSecret chama /api/stripe/account-session
      │ - <ConnectAccountOnboarding /> renderiza inline
      ▼
Usuário preenche dados (nome, CPF, endereço, conta bancária)
      │
      ▼
Stripe envia webhook account.updated
      │ /api/stripe/webhook recebe
      │ UPDATE profiles SET stripe_charges_enabled, stripe_payouts_enabled
      ▼
Frontend faz polling ou recebe via Realtime
      │
      ▼
Quando charges_enabled=true: campanha pode ser publicada
```

## Fluxo de dados — Doação

```
Doador acessa /c/[slug]
      │
      ▼
Página renderizada via SSR (Supabase fetch)
      │ Open Graph dinâmico em /api/og/[slug]
      ▼
Doador clica "Doar agora"
      │
      ▼
Modal/página de doação abre
      │ - Pills de valor: 25, 50, 100, 250, custom
      │ - Toggle "cobrir taxas" (default: ON)
      │ - Form: nome, email, mensagem, anonimato
      ▼
Server Action createPaymentIntent({...})
      │ 1. Valida campaign.status = 'active'
      │ 2. Valida creator.stripe_charges_enabled
      │ 3. Calcula fees via lib/stripe/fees.ts
      │ 4. stripe.paymentIntents.create(
      │      { amount, application_fee_amount, ... },
      │      { stripeAccount: creator.stripe_account_id }  // direct charge
      │    )
      │ 5. INSERT donation status='pending'
      │ 6. Retorna client_secret
      ▼
Frontend monta Stripe <Elements> com stripeAccount=creator.stripe_account_id
      │ <PaymentElement /> renderiza opções (cartão, futuro Pix)
      ▼
Usuário confirma → Stripe processa
      │
      ▼
Stripe envia webhook payment_intent.succeeded
      │ /api/stripe/webhook-connect recebe
      │ UPDATE donation SET status='succeeded', stripe_charge_id=...
      │ Trigger update_campaign_stats() incrementa current_amount_cents, donor_count
      │ Resend envia email recibo pro doador
      │ Resend envia email "nova doação" pro criador
      ▼
Página da campanha atualiza via Supabase Realtime
      │ Lista de doadores recebe novo registro
      │ Barra de progresso anima
```

## Componentes principais

### Frontend

- **Marketing layout**: header simples, footer com links institucionais
- **App layout**: header com avatar, dropdown de conta, navegação dashboard
- **Campaign layout**: minimalista, foca no conteúdo da campanha
- **CampaignHero**: banner + título + criador
- **ProgressSection**: barra animada + stats
- **DonationCTA**: sticky no mobile, lateral no desktop
- **DonationForm**: pills + toggle taxas + nome/email/mensagem
- **DonorList**: subscribe Realtime do Supabase
- **ShareButtons**: WhatsApp, Insta Stories, X, copiar
- **EmbeddedOnboarding**: wrapper Stripe Connect com tema
- **EmbeddedPayouts**: dashboard financeiro do criador

### Backend

- **API Routes**:
  - `/api/stripe/create-account` — POST, cria subconta
  - `/api/stripe/account-session` — POST, gera client secret pra Embedded Components
  - `/api/stripe/create-payment-intent` — POST, cria PI com Direct Charge
  - `/api/stripe/webhook` — POST, eventos da plataforma
  - `/api/stripe/webhook-connect` — POST, eventos de subcontas
  - `/api/og/[slug]` — GET, gera imagem OG dinâmica

- **Server Actions** (preferíveis quando possível):
  - `createCampaign(data)`
  - `updateCampaign(id, data)`
  - `publishCampaign(id)`
  - `addCampaignUpdate(id, content)`
  - `reportCampaign(id, reason)`

### Database

Ver `database.md` pra schema completo. Tabelas principais:
- `profiles` — usuários (extends auth.users)
- `campaigns` — campanhas
- `donations` — doações
- `campaign_images` — galeria
- `campaign_updates` — timeline de novidades
- `reports` — denúncias

## Deploy

### Vercel

- Branch `main` → produção (doatividade.com.br)
- Branch `develop` → staging (staging.doatividade.com.br)
- Pull Requests → preview deploys automáticos

### Supabase

- Projeto único pra produção
- Branching habilitado pra preview/staging
- Migrations versionadas em `supabase/migrations/`

### Stripe

- **Test mode** durante desenvolvimento
- **Live mode** quando lançar (mesmas chaves trocadas via env vars no Vercel)
- Webhooks configurados pra apontar pra `https://doatividade.com.br/api/stripe/webhook` e `/webhook-connect`

## Observabilidade

- **Logs Vercel**: stdout/stderr de API routes e Server Actions
- **Stripe Dashboard**: log de eventos, webhook deliveries, payment intents
- **Supabase Dashboard**: query logs, slow queries
- **Sentry** (futuro V1): error tracking estruturado

## Limites e quando escalar

Vai começar tudo no free tier:
- **Vercel Hobby**: 100 GB-hours/mês, 100 GB bandwidth
- **Supabase Free**: 500 MB DB, 1 GB storage, 50k MAU
- **Stripe**: zero custo fixo

Quando virar pago:
- ~10k MAU → Supabase Pro ($25/mês)
- ~100k requests/dia → Vercel Pro ($20/mês)
- Volume alto → considerar CDN dedicado pras imagens (Cloudflare R2)

## Decisões de arquitetura adiadas

Coisas que NÃO vamos fazer no MVP mas dá pra adicionar depois sem refactor grande:

- **Filas (BullMQ/Inngest)**: webhooks lentos serão tratados síncronos por enquanto
- **Cache em Redis**: Next.js cache + Supabase é suficiente
- **CDN próprio**: Vercel Edge Network atende
- **Multi-tenant org**: cada usuário tem 1 conta. Suporte a "team" depois
- **i18n**: pt-BR único no MVP
- **Multi-PSP**: só Stripe no MVP. Asaas como fallback fica pra V2
