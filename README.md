# Doatividade

> Plataforma brasileira de doações com a menor taxa do mercado. Sua campanha no ar em 5 minutos.

## Sobre

Doatividade é uma plataforma de vaquinha online focada em três coisas: **taxa baixa**, **onboarding rápido** e **UX moderna**. Construída em Next.js + Supabase + Stripe Connect, usando Direct Charge para que o dinheiro vá direto pro criador da campanha sem passar pela plataforma.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, Storage, Realtime)
- Stripe Connect Standard + Embedded Components
- Resend (emails transacionais)
- Vercel (hosting)

## Getting Started

```bash
# Clone
git clone <repo>
cd doatividade

# Install
pnpm install

# Configure env
cp .env.example .env.local
# preencher variáveis em .env.local

# Run dev server
pnpm dev
```

Acesse http://localhost:3000

## Documentação

- `CLAUDE.md` — guia pra Claude Code
- `docs/architecture.md` — arquitetura geral
- `docs/database.md` — schema do banco
- `docs/stripe-integration.md` — integração Stripe
- `docs/pricing.md` — modelo de taxas
- `docs/roadmap.md` — fases do projeto
- `docs/security.md` — segurança e LGPD

## Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
```

## Estrutura

```
app/        # Next.js App Router pages
components/ # React components
lib/        # SDK wrappers, utilities
docs/       # Project documentation
supabase/   # DB migrations
types/      # Generated TypeScript types
```

## Status

🚧 Pré-desenvolvimento — setup de contas e documentação.

## Licença

Proprietário — todos os direitos reservados.
