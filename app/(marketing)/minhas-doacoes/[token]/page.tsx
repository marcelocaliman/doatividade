import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, CalendarDays, Heart, ShieldCheck } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatDate } from "@/lib/utils/format";
import { CancelSubscriptionButton } from "./cancel-subscription-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Minhas doações · Doatividade",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function DonorAreaPage({ params }: Props) {
  const { token } = await params;
  const sb = createServiceClient();

  // Valida token (existe + não expirou)
  const { data: tokenRow } = await sb
    .from("donor_access_tokens")
    .select("token, email, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) notFound();

  const expired = new Date(tokenRow.expires_at) < new Date();
  if (expired) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-20 md:py-28">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-sm md:p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Link expirado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esse link só vale por 24 horas. Pede um novo passando seu email
            outra vez.
          </p>
          <Link
            href="/minhas-doacoes"
            className="mt-6 inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Pedir novo link
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  // Carrega subscriptions desse email — incluindo dados da campanha
  const { data: subs } = await sb
    .from("subscriptions")
    .select(
      `
      id,
      amount_cents,
      status,
      current_period_end,
      canceled_at,
      created_at,
      stripe_subscription_id,
      campaign:campaigns!inner (
        id,
        slug,
        title
      )
    `
    )
    .eq("donor_email", tokenRow.email)
    .order("created_at", { ascending: false });

  const active = (subs ?? []).filter(
    (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due"
  );
  const inactive = (subs ?? []).filter(
    (s) => s.status === "canceled" || s.status === "incomplete_expired" || s.status === "unpaid"
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Suas doações
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Olá 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aqui você gerencia suas doações mensais para{" "}
          <strong className="text-foreground">{tokenRow.email}</strong>. Cancele
          a qualquer momento — sem multa, sem ligação.
        </p>
      </header>

      {active.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Ativas ({active.length})
          </h2>
          <div className="flex flex-col gap-4">
            {active.map((s) => (
              <SubscriptionCard
                key={s.id}
                token={token}
                subscription={s}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Você não tem nenhuma doação mensal ativa.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Que tal apoiar uma causa hoje?
          </p>
          <Link
            href="/explorar"
            className="mt-4 inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Explorar campanhas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {inactive.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Histórico ({inactive.length})
          </h2>
          <div className="flex flex-col gap-3">
            {inactive.map((s) => (
              <InactiveSubscriptionRow key={s.id} subscription={s} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-12 flex items-start gap-3 rounded-xl border bg-muted/30 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Pagamento seguro</p>
          <p>
            Seus dados de cartão ficam só com a Stripe — Doatividade nunca toca
            neles. Cobranças aparecem no extrato como <strong>DOATIVIDADE</strong>.
          </p>
        </div>
      </footer>
    </main>
  );
}

type SubRow = {
  id: string;
  amount_cents: number;
  status: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  stripe_subscription_id: string;
  campaign: {
    id: string;
    slug: string;
    title: string;
  };
};

function SubscriptionCard({
  token,
  subscription,
}: {
  token: string;
  subscription: SubRow;
}) {
  const { campaign } = subscription;
  const nextCharge = subscription.current_period_end
    ? formatDate(subscription.current_period_end)
    : "—";
  const isPastDue = subscription.status === "past_due";

  return (
    <article
      className={
        "rounded-2xl border bg-card p-5 shadow-sm md:p-6 " +
        (isPastDue ? "border-amber-300 bg-amber-50/40" : "")
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/c/${campaign.slug}`}
            className="text-base font-semibold tracking-tight text-foreground hover:text-primary"
          >
            {campaign.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Apoiando desde {formatDate(subscription.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-primary">
            {formatBRL(subscription.amount_cents)}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            por mês
          </p>
        </div>
      </div>

      {isPastDue ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <p>
            <strong>Cobrança pendente.</strong> Sua última cobrança falhou.
            Vamos tentar de novo automaticamente. Se o cartão mudou, atualize{" "}
            <a
              href={`mailto:contato@doatividade.com?subject=Atualizar%20cart%C3%A3o%20%E2%80%94%20${subscription.stripe_subscription_id}`}
              className="font-semibold underline underline-offset-2"
            >
              entrando em contato
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>
            Próxima cobrança em <strong className="text-foreground">{nextCharge}</strong>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/c/${campaign.slug}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver campanha →
        </Link>
        <CancelSubscriptionButton
          token={token}
          subscriptionId={subscription.id}
          amountFormatted={formatBRL(subscription.amount_cents)}
          campaignTitle={campaign.title}
        />
      </div>
    </article>
  );
}

function InactiveSubscriptionRow({ subscription }: { subscription: SubRow }) {
  const { campaign } = subscription;
  const labels: Record<string, string> = {
    canceled: "Cancelada",
    incomplete_expired: "Expirou sem confirmar",
    unpaid: "Não paga",
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground/75">
          {campaign.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {labels[subscription.status] ?? subscription.status} ·{" "}
          {subscription.canceled_at
            ? `em ${formatDate(subscription.canceled_at)}`
            : `criada em ${formatDate(subscription.created_at)}`}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground/55">
        {formatBRL(subscription.amount_cents)}/mês
      </span>
    </div>
  );
}
