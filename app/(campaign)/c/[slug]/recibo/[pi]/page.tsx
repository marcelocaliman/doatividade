import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatBRL, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ReceiptActions } from "./receipt-actions";

export const metadata = {
  title: "Comprovante de doação — Doatividade",
};

type Props = { params: Promise<{ slug: string; pi: string }> };

export default async function ReceiptPage({ params }: Props) {
  const { slug, pi } = await params;

  // Lê via service role pra contornar a RLS (donations só dono lê).
  // O acesso público é controlado pelo conhecimento do payment_intent_id,
  // que só quem fez a doação tem (pi_xxx é gerado pelo Stripe e mandado
  // por email só pra esse doador). Funciona como token.
  const adminSb = createServiceClient();
  const { data: donation } = await adminSb
    .from("donations")
    .select(
      "id, donor_name, donor_email, is_anonymous, amount_cents, payment_method, status, created_at, application_fee_cents, stripe_fee_cents, net_to_creator_cents, donor_covered_fees, stripe_payment_intent_id, campaign_id"
    )
    .eq("stripe_payment_intent_id", pi)
    .maybeSingle();

  if (!donation || donation.status !== "succeeded") notFound();

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, slug, user_id")
    .eq("id", donation.campaign_id)
    .maybeSingle();

  if (!campaign || campaign.slug !== slug) notFound();

  const { data: creator } = await adminSb
    .from("profiles")
    .select("full_name, organization_name, organization_cnpj")
    .eq("id", campaign.user_id)
    .maybeSingle();

  const creatorLabel =
    creator?.organization_name ?? creator?.full_name ?? "Criador";

  return (
    <div
      className="min-h-screen bg-muted/30 print:bg-white"
      style={{ colorScheme: "light" }}
    >
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 md:px-6">
          <Logo size="md" href="/" />
          <div className="flex items-center gap-2">
            <Link
              href={`/c/${slug}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Voltar pra campanha
            </Link>
            <ReceiptActions />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 print:py-0">
        <article className="mx-auto rounded-2xl border bg-background p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none md:p-12 print:p-0">
          <div className="flex items-start justify-between gap-4 border-b pb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Comprovante de doação
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                Doatividade
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Plataforma de tecnologia · doatividade.com.br
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Recibo nº</p>
              <p className="mt-1 font-mono text-[11px] text-foreground">
                {donation.stripe_payment_intent_id}
              </p>
            </div>
          </div>

          <div className="grid gap-6 py-6 md:grid-cols-2">
            <Field label="Doador">
              {donation.is_anonymous
                ? "Anônimo"
                : donation.donor_name ?? "—"}
            </Field>
            {!donation.is_anonymous && donation.donor_email ? (
              <Field label="Email">{donation.donor_email}</Field>
            ) : null}
            <Field label="Data da doação">
              {donation.created_at ? formatDate(donation.created_at) : "—"}
            </Field>
            <Field label="Forma de pagamento">
              {donation.payment_method === "pix" ? "Pix" : "Cartão de crédito"}
            </Field>
          </div>

          <div className="border-t pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Beneficiário
            </p>
            <p className="mt-2 text-base font-semibold">{creatorLabel}</p>
            {creator?.organization_cnpj ? (
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                CNPJ {creator.organization_cnpj}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              Campanha:{" "}
              <span className="font-medium text-foreground">
                {campaign.title}
              </span>
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-muted/50 p-5">
            <div className="flex items-baseline justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">
                Valor da doação
              </span>
              <span className="text-3xl font-bold tabular-nums">
                {formatBRL(donation.amount_cents)}
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {donation.donor_covered_fees ? (
                <p>
                  ✓ Você optou por cobrir as taxas — o beneficiário recebeu
                  o valor integral.
                </p>
              ) : (
                <p>
                  Taxas de processamento (Stripe + plataforma) descontadas
                  da doação.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Importante:</strong> a
              Doatividade é apenas a plataforma de intermediação tecnológica.
              O processamento financeiro é feito pela Stripe Inc. e o repasse
              vai direto pra conta do criador da campanha (Direct Charge).
              Este documento serve como comprovante da transação.
            </p>
            <p className="mt-3">
              Em caso de dúvidas, contate{" "}
              <a
                href="mailto:contato@doatividade.com.br"
                className="text-primary underline-offset-2 hover:underline"
              >
                contato@doatividade.com.br
              </a>
              .
            </p>
          </div>
        </article>

        <div className="mt-6 flex justify-center print:hidden">
          <ReceiptActions variant="bottom" />
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{children}</p>
    </div>
  );
}

