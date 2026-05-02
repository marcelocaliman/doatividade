# Roadmap

## Visão de fases

```
Pré-dev    →    MVP    →    V1    →    V2    →    V3+
(setup)        (cartão)    (Pix)     (escala)   (extras)
```

## Fase 0 — Pré-desenvolvimento (atual)

**Objetivo**: ter todas as contas e ferramentas prontas pra começar a codar.

- [ ] Gmail mestre criado (`doatividade@gmail.com` ou similar)
- [ ] Conta GitHub criada
- [ ] Repositório `doatividade` criado (privado)
- [ ] Conta Vercel conectada ao GitHub
- [ ] Conta Supabase criada
- [ ] Conta Stripe criada (test mode ativo, Connect habilitado)
- [ ] Domínio `doatividade.com.br` registrado
- [ ] Conta Resend criada
- [ ] Documentação completa anexada ao Project Knowledge no Claude.ai
- [ ] CLAUDE.md commitado na raiz do repo

## Fase 1 — MVP (4-6 semanas)

**Objetivo**: lançar versão mínima viável que processa doações via cartão.

### Semana 1 — Foundation

- [ ] Setup Next.js 15 + TypeScript + Tailwind v4
- [ ] Setup shadcn/ui com tema customizado
- [ ] Setup Supabase client (browser + server + service)
- [ ] Setup Stripe SDK (server + client)
- [ ] Setup Resend
- [ ] Configurar env vars
- [ ] Setup ESLint + Prettier
- [ ] Setup CI básico no GitHub Actions (lint + typecheck)

### Semana 2 — Database + Auth

- [ ] Migrations completas (ver `database.md`)
- [ ] RLS policies aplicadas
- [ ] Triggers funcionando
- [ ] Storage buckets criados
- [ ] Google OAuth configurado no Supabase Auth
- [ ] Trigger `handle_new_user` testado
- [ ] Página de login + logout
- [ ] Layout `(app)` com auth required

### Semana 3 — Stripe Connect

- [ ] Endpoint `create-account`
- [ ] Endpoint `account-session`
- [ ] Componente `EmbeddedOnboarding` com tema
- [ ] Página `/onboarding/stripe`
- [ ] Webhook handler `account.updated`
- [ ] Testar fluxo completo de onboarding em sandbox
- [ ] Componente `EmbeddedPayouts` no dashboard

### Semana 4 — Campanhas

- [ ] Página `/campanha/criar` (formulário completo)
- [ ] Upload de banner pro Supabase Storage
- [ ] Markdown editor pra descrição
- [ ] Server Action `createCampaign`
- [ ] Página `/dashboard` com lista de campanhas do usuário
- [ ] Página `/c/[slug]` (versão básica, sem doação ainda)
- [ ] SSR com metadata
- [ ] Edição de campanha

### Semana 5 — Doações

- [ ] Endpoint `create-payment-intent` (Direct Charge)
- [ ] `lib/stripe/fees.ts` com cálculos
- [ ] Componente `DonationForm` com pills + toggle taxas
- [ ] Stripe Payment Element configurado pra contexto da subconta
- [ ] Página de confirmação pós-doação
- [ ] Webhook `payment_intent.succeeded`
- [ ] Trigger atualiza contadores
- [ ] Lista de doadores na página da campanha

### Semana 6 — Polimento + Lançamento

- [ ] Open Graph dinâmico em `/api/og/[slug]`
- [ ] Botões de compartilhamento (WhatsApp, X, copiar)
- [ ] QR Code da campanha
- [ ] Email transacional (recibo doador, notificação criador)
- [ ] Landing page completa
- [ ] Página de FAQ
- [ ] Página de Termos e Privacidade
- [ ] Botão "Denunciar" + endpoint
- [ ] Antifraude básico (review 24h, limite R$ 10k)
- [ ] Configurar webhooks de produção no Stripe
- [ ] Setup Sentry pra error tracking
- [ ] Domínio + SSL configurado
- [ ] Smoke test completo
- [ ] **Lançamento beta**

## Fase 2 — V1 (4-6 semanas pós-lançamento)

**Objetivo**: ativar Pix e features que dependem de tração.

### Pix

- [ ] Solicitar liberação Pix no Stripe (após 60d de cartão)
- [ ] Adicionar Pix em `payment_method_types` quando aprovado
- [ ] UI mostra Pix como método preferencial
- [ ] Atualizar pricing.md e copy

### Realtime

- [ ] Lista de doadores em tempo real (Supabase Realtime)
- [ ] Animação quando nova doação chega
- [ ] Contador de visitantes online (opcional)

### Features de campanha

- [ ] Atualizações da campanha (timeline)
- [ ] Galeria de imagens adicional
- [ ] Doação recorrente (mensal) — integração Stripe Subscriptions
- [ ] Categorias com filtro/busca
- [ ] Página de exploração de campanhas

### Dashboard avançado

- [ ] Gráfico de doações ao longo do tempo
- [ ] Lista detalhada de doações (export CSV)
- [ ] Saque manual via Stripe Connect Express Dashboard embedded
- [ ] Notificações in-app
- [ ] Configurações de privacidade

### Trust & safety

- [ ] Hash perceptual de imagens pra detectar duplicação
- [ ] Sistema de denúncias com fila de moderação
- [ ] Verificação por SMS opcional
- [ ] Badge "Verificado" pra contas com KYC + verificação extra
- [ ] Termos de uso revisados juridicamente

## Fase 3 — V2 (3-6 meses pós-V1)

**Objetivo**: escalar e diferenciar.

### Features de impacto

- [ ] Vídeo embedado na campanha (YouTube/Vimeo)
- [ ] Marcos/milestones ("ao bater R$ 5k, faremos X")
- [ ] Modo "match" (alguém promete dobrar doações)
- [ ] Transparência de uso (criador documenta como gastou)
- [ ] Templates de campanha por categoria

### ONGs

- [ ] Verificação de CNPJ + cadastro de utilidade pública
- [ ] Recibo fiscal automatizado (integração com NF-e)
- [ ] Página de ONG (perfil persistente, várias campanhas)
- [ ] Relatórios pra prestação de contas

### Crescimento

- [ ] SEO avançado (sitemap dinâmico, rich snippets)
- [ ] Programa de embaixadores (criadores indicam → recebem bônus)
- [ ] Integração WhatsApp Business (notificações + atendimento)
- [ ] App mobile nativo (React Native compartilhando código)

### Multi-PSP

- [ ] Adicionar Asaas como provedor alternativo
- [ ] Criador escolhe provedor (Stripe ou Asaas)
- [ ] Fallback automático se Stripe não estiver disponível

### Internacionalização

- [ ] Suporte multi-idioma (pt-BR, en-US, es-ES)
- [ ] Multi-moeda
- [ ] Stripe Connect em outros países

## Fase 4+ — Futuro distante

Ideias pra explorar quando produto estiver maduro:

- **Doatividade Pro**: assinatura mensal pra ONGs com features avançadas (analytics, automações, white-label)
- **API pública**: criadores integram doações em seus próprios sites
- **Marketplace de causas**: descoberta inteligente baseada em interesses do doador
- **NFT/Web3**: certificados de doação como NFT (se fizer sentido cultural)
- **Crowdfunding com recompensas**: estilo Catarse/Kickstarter
- **B2B**: empresas patrocinam campanhas (matching de funcionários)

## Métricas de sucesso por fase

### MVP
- 100 campanhas criadas
- R$ 50k total arrecadado
- Taxa de onboarding completion > 60%
- 0 chargebacks fraudulentos

### V1 (3 meses pós-MVP)
- 1.000 campanhas ativas
- R$ 500k arrecadados/mês
- Pix > 50% das doações
- NPS > 50

### V2 (6 meses pós-V1)
- 10.000 campanhas
- R$ 5M arrecadados/mês
- Liderança em taxa baixa pra Pix
- Mídia espontânea (notícias citando Doatividade)

## Política de priorização

Quando surgir conflito de prioridade:

1. **Segurança e compliance** sempre antes de feature
2. **Bugs que afetam dinheiro** sempre antes de UX
3. **Features que aumentam conversão** antes de nice-to-have
4. **Pedidos repetidos de criadores** > pedidos únicos
5. **Reduzir taxa** > adicionar feature (no início)
