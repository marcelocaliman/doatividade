# Integração Stripe

## Visão Geral

Doatividade usa **Stripe Connect Standard** com **Direct Charge** e **Embedded Components**. Resumindo:

- Cada criador de campanha tem uma **subconta Stripe** (criada via API)
- Doações são processadas via **Direct Charge**: dinheiro vai direto pra subconta do criador
- A Doatividade recebe **application fee** automaticamente, debitado no momento da cobrança
- Compliance (KYC, AML, chargebacks) fica todo com Stripe
- Onboarding é via **Embedded Components**, com tema customizado pra parecer parte do app

## Conceitos chave

### Connect Standard vs Custom vs Express

Escolhemos **Standard** porque:
- Compliance fica com Stripe (não com Doatividade)
- Criador tem dashboard próprio (não precisamos construir um do zero)
- Branding mínimo do Stripe nas telas embedded
- Onboarding é mais fluido pra quem já tem conta Stripe (networked onboarding)

Standard tem 3 opções de onboarding: Hosted (redireciona pro Stripe), **Embedded (escolhido)** ou API (não suportado em Standard).

### Direct Charge vs Destination Charge vs Separate Charges

Escolhemos **Direct Charge** porque:
- Dinheiro NUNCA passa pela Doatividade (nem como custódia)
- Criador é o "merchant of record" — aparece o nome dele no extrato do doador
- Chargebacks vão pro criador, não pra plataforma
- Não enquadra Doatividade como instituição de pagamento perante o BCB

Como funciona: ao criar PaymentIntent, passa `{ stripeAccount: 'acct_XXX' }` como segundo parâmetro. O Stripe cria a cobrança no contexto daquela subconta. O `application_fee_amount` é automaticamente debitado e cai na conta plataforma.

### Application Fee

É a taxa que a plataforma cobra. Não confundir com taxa do Stripe (que é separada).

Numa doação de R$ 100 via Pix:
- R$ 100 entram na subconta do criador
- Stripe debita R$ 1,19 (1,19% Pix)
- Stripe debita R$ 2,80 (`application_fee_amount` = 280 centavos)
- Criador fica com R$ 96,01
- Doatividade recebe R$ 2,80 na conta plataforma

## Setup inicial

### 1. Criar conta Stripe

Acessar [dashboard.stripe.com/register](https://dashboard.stripe.com/register).

- Email: o Gmail mestre do projeto
- País: Brasil
- Tipo: **Company** (com CNPJ da empresa existente)

### 2. Ativar Connect

No dashboard, ir em **Connect** no menu lateral → **Get started** → escolher **Platform or marketplace**.

### 3. Configurar branding

**Connect Settings** → **Branding**:
- Logo
- Cor primária (mesma do app: `#10b981`)
- Ícone

Isso aparece em emails do Stripe pros criadores e em alguns elementos das telas embedded.

### 4. Configurar capabilities

**Connect Settings** → garantir que `card_payments` e `transfers` estão habilitadas pra Brazil.

### 5. Configurar webhook endpoints

Dois endpoints separados precisam ser criados em **Developers > Webhooks**:

**Endpoint 1: Conta plataforma** (eventos da própria conta Doatividade)
- URL: `https://doatividade.com.br/api/stripe/webhook`
- Eventos:
  - `account.updated`
  - `account.application.deauthorized`
  - `payout.paid`
  - `payout.failed`

**Endpoint 2: Connected accounts** (eventos das subcontas)
- URL: `https://doatividade.com.br/api/stripe/webhook-connect`
- Toggle "Listen to events on Connected accounts" deve estar ON
- Eventos:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.refunded`
  - `charge.dispute.created`
  - `charge.dispute.closed`

Cada endpoint gera um `whsec_...` separado. Ambos vão pras env vars (`STRIPE_WEBHOOK_SECRET` e `STRIPE_CONNECT_WEBHOOK_SECRET`).

## Implementação

### Cliente Stripe (server)

```ts
// lib/stripe/server.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  appInfo: {
    name: 'Doatividade',
    version: '1.0.0',
    url: 'https://doatividade.com.br',
  },
});
```

### Cliente Stripe (browser, com contexto de subconta)

```ts
// lib/stripe/client.ts
import { loadStripe, type Stripe } from '@stripe/stripe-js';

const cache = new Map<string | undefined, Promise<Stripe | null>>();

export function getStripe(stripeAccount?: string): Promise<Stripe | null> {
  const key = stripeAccount ?? '__platform__';
  if (!cache.has(key)) {
    cache.set(
      key,
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        stripeAccount,  // se passado, opera no contexto da subconta
      })
    );
  }
  return cache.get(key)!;
}
```

### Aparência customizada (tema do app)

```ts
// lib/stripe/appearance.ts
export const stripeAppearance = {
  variables: {
    colorPrimary: '#10b981',
    colorBackground: '#ffffff',
    colorText: '#0a0a0a',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '8px',
    borderRadius: '12px',
    fontSizeBase: '16px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
    },
    '.Input:focus': {
      borderColor: '#10b981',
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
    },
    '.Tab': {
      border: '1px solid #e5e7eb',
    },
    '.Tab--selected': {
      borderColor: '#10b981',
      backgroundColor: '#f0fdf4',
    },
  },
} as const;

// Pra Embedded Components (formato diferente)
export const connectAppearance = {
  overlays: 'dialog' as const,
  variables: {
    colorPrimary: '#10b981',
    colorBackground: '#ffffff',
    colorText: '#0a0a0a',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '8px',
    borderRadius: '12px',
    buttonPrimaryColorBackground: '#10b981',
    buttonPrimaryColorBorder: '#10b981',
    buttonPrimaryColorText: '#ffffff',
    badgeSuccessColorBackground: '#10b981',
  },
} as const;
```

### Criar subconta

```ts
// app/api/stripe/create-account/route.ts
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_account_id) {
    return Response.json({ accountId: profile.stripe_account_id });
  }

  const account = await stripe.accounts.create({
    type: 'standard',
    country: 'BR',
    email: user.email!,
    business_type: profile?.account_type === 'organization' ? 'company' : 'individual',
    business_profile: {
      mcc: '8398',  // Charitable and Social Service Organizations
      product_description: 'Recebimento de doações através da plataforma Doatividade',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/u/${user.id}`,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      doatividade_user_id: user.id,
    },
  });

  await supabase
    .from('profiles')
    .update({ stripe_account_id: account.id })
    .eq('id', user.id);

  return Response.json({ accountId: account.id });
}
```

### Account Session pra Embedded Components

```ts
// app/api/stripe/account-session/route.ts
import { stripe } from '@/lib/stripe/server';

export async function POST(req: Request) {
  const { accountId } = await req.json();
  
  const accountSession = await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: {
        enabled: true,
        features: {
          external_account_collection: true,
        },
      },
      payouts: {
        enabled: true,
        features: {
          instant_payouts: true,
          standard_payouts: true,
          edit_payout_schedule: true,
        },
      },
      payments: { enabled: true },
      balances: { enabled: true },
    },
  });

  return Response.json({ clientSecret: accountSession.client_secret });
}
```

### Componente de Embedded Onboarding

```tsx
// components/stripe/embedded-onboarding.tsx
'use client';

import { useEffect, useState } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js';
import { connectAppearance } from '@/lib/stripe/appearance';

interface Props {
  accountId: string;
  onExit: () => void;
}

export function EmbeddedOnboarding({ accountId, onExit }: Props) {
  const [instance, setInstance] = useState<any>(null);

  useEffect(() => {
    const init = loadConnectAndInitialize({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      fetchClientSecret: async () => {
        const res = await fetch('/api/stripe/account-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId }),
        });
        const { clientSecret } = await res.json();
        return clientSecret;
      },
      appearance: connectAppearance,
    });
    setInstance(init);
  }, [accountId]);

  if (!instance) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <ConnectAccountOnboarding
        onExit={onExit}
        collectionOptions={{
          fields: 'currently_due',  // só mínimo no início
          futureRequirements: 'omit',
        }}
      />
    </ConnectComponentsProvider>
  );
}
```

### Cálculo de taxas

```ts
// lib/stripe/fees.ts

export type PaymentMethod = 'card' | 'pix';

export interface FeeCalculation {
  netToCreatorCents: number;
  totalChargedCents: number;
  stripeFeeCents: number;
  applicationFeeCents: number;
}

const PLATFORM_FEES = {
  pix: 0.028,    // 2.8%
  card: 0.03,    // 3.0%
};

const STRIPE_FEES = {
  pix: { percent: 0.0119, fixed: 0 },              // 1.19%
  card: { percent: 0.0399, fixed: 39 },            // 3.99% + R$ 0,39
};

export function calculateFees(
  amountCents: number,
  method: PaymentMethod,
  donorCovers: boolean
): FeeCalculation {
  const platformPct = PLATFORM_FEES[method];
  const stripePct = STRIPE_FEES[method].percent;
  const stripeFixed = STRIPE_FEES[method].fixed;

  if (donorCovers) {
    // amountCents é o que criador deve receber. Calculamos quanto cobrar.
    // total - (total * stripePct + stripeFixed) - (total * platformPct) = amountCents
    // total * (1 - stripePct - platformPct) = amountCents + stripeFixed
    const totalCharged = Math.ceil(
      (amountCents + stripeFixed) / (1 - stripePct - platformPct)
    );
    const stripeFee = Math.ceil(totalCharged * stripePct) + stripeFixed;
    const applicationFee = Math.ceil(totalCharged * platformPct);
    
    return {
      netToCreatorCents: amountCents,
      totalChargedCents: totalCharged,
      stripeFeeCents: stripeFee,
      applicationFeeCents: applicationFee,
    };
  } else {
    // Criador absorve. Doador paga amountCents, taxas saem disso.
    const stripeFee = Math.ceil(amountCents * stripePct) + stripeFixed;
    const applicationFee = Math.ceil(amountCents * platformPct);
    
    return {
      netToCreatorCents: amountCents - applicationFee - stripeFee,
      totalChargedCents: amountCents,
      stripeFeeCents: stripeFee,
      applicationFeeCents: applicationFee,
    };
  }
}
```

### Criar PaymentIntent (Direct Charge)

```ts
// app/api/stripe/create-payment-intent/route.ts
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { calculateFees } from '@/lib/stripe/fees';
import { z } from 'zod';

const Schema = z.object({
  campaignId: z.string().uuid(),
  amountCents: z.number().int().min(500).max(10000000),  // R$ 5 a R$ 100k
  donorCoversFees: z.boolean(),
  donorName: z.string().min(1).max(100),
  donorEmail: z.string().email(),
  donorMessage: z.string().max(500).optional(),
  isAnonymous: z.boolean(),
  paymentMethod: z.enum(['card', 'pix']),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = Schema.parse(body);
  
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, profiles!inner(stripe_account_id, stripe_charges_enabled)')
    .eq('id', data.campaignId)
    .eq('status', 'active')
    .single();

  if (error || !campaign) {
    return new Response('Campaign not found or not active', { status: 404 });
  }

  if (!campaign.profiles.stripe_charges_enabled) {
    return new Response('Campaign creator not ready to receive', { status: 400 });
  }

  const fees = calculateFees(data.amountCents, data.paymentMethod, data.donorCoversFees);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: fees.totalChargedCents,
      currency: 'brl',
      payment_method_types: data.paymentMethod === 'pix' ? ['pix'] : ['card'],
      application_fee_amount: fees.applicationFeeCents,
      receipt_email: data.donorEmail,
      metadata: {
        campaign_id: data.campaignId,
        donor_name: data.donorName,
        donor_email: data.donorEmail,
        donor_message: data.donorMessage ?? '',
        is_anonymous: String(data.isAnonymous),
        donor_covered_fees: String(data.donorCoversFees),
        application_fee_cents: String(fees.applicationFeeCents),
        stripe_fee_cents: String(fees.stripeFeeCents),
        net_to_creator_cents: String(fees.netToCreatorCents),
      },
    },
    { stripeAccount: campaign.profiles.stripe_account_id }  // <-- DIRECT CHARGE
  );

  return Response.json({
    clientSecret: paymentIntent.client_secret,
    stripeAccount: campaign.profiles.stripe_account_id,
    fees,
  });
}
```

### Webhook handler — eventos da plataforma

```ts
// app/api/stripe/webhook/route.ts
import { stripe } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object;
      await supabase
        .from('profiles')
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
          stripe_details_submitted: account.details_submitted,
        })
        .eq('stripe_account_id', account.id);
      break;
    }

    case 'account.application.deauthorized': {
      // Criador desconectou a conta
      const account = event.account;
      await supabase
        .from('profiles')
        .update({
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        })
        .eq('stripe_account_id', account!);
      
      // Pausar todas campanhas dele
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_account_id', account!)
        .single();
      
      if (profile) {
        await supabase
          .from('campaigns')
          .update({ status: 'paused' })
          .eq('user_id', profile.id)
          .eq('status', 'active');
      }
      break;
    }
  }

  return Response.json({ received: true });
}
```

### Webhook handler — eventos de subcontas

```ts
// app/api/stripe/webhook-connect/route.ts
import { stripe } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendDonationReceipt, sendNewDonationNotification } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      
      const { error } = await supabase
        .from('donations')
        .upsert(
          {
            stripe_payment_intent_id: pi.id,
            stripe_charge_id: pi.latest_charge as string,
            campaign_id: pi.metadata.campaign_id,
            donor_name: pi.metadata.donor_name,
            donor_email: pi.metadata.donor_email,
            donor_message: pi.metadata.donor_message || null,
            is_anonymous: pi.metadata.is_anonymous === 'true',
            amount_cents: pi.amount_received,
            application_fee_cents: parseInt(pi.metadata.application_fee_cents),
            stripe_fee_cents: parseInt(pi.metadata.stripe_fee_cents),
            net_to_creator_cents: parseInt(pi.metadata.net_to_creator_cents),
            donor_covered_fees: pi.metadata.donor_covered_fees === 'true',
            payment_method: pi.payment_method_types[0] === 'pix' ? 'pix' : 'card',
            status: 'succeeded',
          },
          { onConflict: 'stripe_payment_intent_id' }
        );

      if (!error) {
        // Trigger update_campaign_stats() roda automaticamente
        await Promise.all([
          sendDonationReceipt(pi),
          sendNewDonationNotification(pi),
        ]);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await supabase
        .from('donations')
        .upsert(
          {
            stripe_payment_intent_id: pi.id,
            campaign_id: pi.metadata.campaign_id,
            donor_email: pi.metadata.donor_email,
            amount_cents: pi.amount,
            application_fee_cents: 0,
            status: 'failed',
            failure_reason: pi.last_payment_error?.message ?? 'Unknown',
          },
          { onConflict: 'stripe_payment_intent_id' }
        );
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      await supabase
        .from('donations')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_charge_id', charge.id);
      // Trigger reverte contadores
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object;
      await supabase
        .from('donations')
        .update({
          status: 'disputed',
          disputed_at: new Date().toISOString(),
        })
        .eq('stripe_charge_id', dispute.charge as string);
      // Notificar criador via email
      break;
    }
  }

  return Response.json({ received: true });
}
```

## Testando localmente

### Cartões de teste

| Cenário | Número |
|---|---|
| Sucesso | `4242 4242 4242 4242` |
| Insufficient funds | `4000 0000 0000 9995` |
| Requires authentication (3DS) | `4000 0025 0000 3155` |
| Generic decline | `4000 0000 0000 0002` |

CVV qualquer (ex: `123`), validade qualquer futura (ex: `12/30`).

### Webhook local

```bash
# Terminal 1
pnpm dev

# Terminal 2 — webhook plataforma
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3 — webhook subcontas
stripe listen --forward-connect-to localhost:3000/api/stripe/webhook-connect
```

Cada `stripe listen` mostra um `whsec_...` no console. Copia pra `.env.local`.

### Disparar evento manualmente

```bash
stripe trigger payment_intent.succeeded
stripe trigger account.updated
```

## Migrando pra produção

Quando lançar (após Stripe aprovar conta real):

1. Trocar env vars no Vercel:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → novo whsec do endpoint live
   - `STRIPE_CONNECT_WEBHOOK_SECRET` → idem
2. Configurar webhooks de produção apontando pra `https://doatividade.com.br/api/stripe/...`
3. Confirmar Connect ativado também em live mode
4. Configurar branding em live mode (mesmas configs que test mode)
5. Smoke test: criar conta nova, completar onboarding, fazer doação real de R$ 5

## Ativando Pix (futuro)

Stripe Pix é invite-only no Brasil. Pra liberar:

1. Processar volume mínimo em cartão por 60+ dias
2. Manter conta sem reclamações ou disputas
3. Solicitar via support do Stripe
4. Quando aprovado, Pix vira opção em `payment_method_types`

Código já está preparado pra Pix — só não vai aparecer pro doador até estar liberado.
