import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  donorName: string;
  campaignTitle: string;
  campaignUrl: string;
  amountFormatted: string; // ex: "R$ 25,00"
  /** Conteúdo principal do email — varia por evento */
  variant: "welcome" | "renewed" | "payment_failed" | "canceled" | "winback";
  /** URL do painel /minhas-doacoes/[token] */
  manageUrl?: string | null;
  /** Próxima cobrança formatada (welcome / renewed) */
  nextChargeAt?: string | null;
  /** Mensagem de erro do Stripe (payment_failed) */
  failureReason?: string | null;
};

export function SubscriptionEventEmail({
  donorName,
  campaignTitle,
  campaignUrl,
  amountFormatted,
  variant,
  manageUrl,
  nextChargeAt,
  failureReason,
}: Props) {
  const firstName = donorName.split(" ")[0] ?? donorName;
  const copy = COPY[variant];

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>Doatividade</Text>
          </Section>

          <Heading style={h1}>{copy.heading(firstName)}</Heading>

          <Text style={paragraph}>{copy.intro(campaignTitle, amountFormatted)}</Text>

          {variant === "welcome" || variant === "renewed" ? (
            <Section style={infoBox}>
              <Text style={infoLine}>
                <strong>Valor mensal:</strong> {amountFormatted}
              </Text>
              {nextChargeAt ? (
                <Text style={infoLine}>
                  <strong>Próxima cobrança:</strong> {nextChargeAt}
                </Text>
              ) : null}
            </Section>
          ) : null}

          {variant === "payment_failed" && failureReason ? (
            <Section style={alertBox}>
              <Text style={alertLine}>
                <strong>Motivo:</strong> {failureReason}
              </Text>
            </Section>
          ) : null}

          {copy.body ? (
            <Text style={paragraph}>
              {copy.body(campaignTitle, amountFormatted)}
            </Text>
          ) : null}

          <Section style={ctaWrap}>
            <Button style={button} href={copy.ctaUrl({ campaignUrl, manageUrl })}>
              {copy.ctaLabel}
            </Button>
          </Section>

          {variant !== "winback" && manageUrl ? (
            <Text style={muted}>
              Pra ver, atualizar ou cancelar suas doações mensais a qualquer
              momento, acesse{" "}
              <Link href={manageUrl} style={link}>
                seu painel
              </Link>
              .
            </Text>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Doatividade · plataforma brasileira de vaquinhas online.
            <br />
            Você está recebendo esse email porque tem uma doação mensal vinculada
            à campanha <strong>{campaignTitle}</strong>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

type CopyEntry = {
  preview: string;
  heading: (name: string) => string;
  intro: (title: string, amount: string) => string;
  body?: (title: string, amount: string) => string;
  ctaLabel: string;
  ctaUrl: (urls: { campaignUrl: string; manageUrl?: string | null }) => string;
};

const COPY: Record<Props["variant"], CopyEntry> = {
  welcome: {
    preview: "Sua doação mensal foi confirmada. Obrigado pelo apoio!",
    heading: (name) => `Bem-vindo, ${name} 💙`,
    intro: (title, amount) =>
      `Sua doação mensal de ${amount} pra "${title}" foi confirmada. Toda mês, no mesmo dia, a gente cobra seu cartão automaticamente — você não precisa fazer nada.`,
    body: () =>
      "Você ajuda a manter a causa viva sem precisar lembrar de doar de novo. Cancele a qualquer momento, sem burocracia.",
    ctaLabel: "Ver a campanha",
    ctaUrl: ({ campaignUrl }) => campaignUrl,
  },
  renewed: {
    preview: "Sua doação mensal foi cobrada com sucesso",
    heading: (name) => `Obrigado de novo, ${name}!`,
    intro: (title, amount) =>
      `Mais uma doação mensal de ${amount} pra "${title}" acabou de cair. Cada cobrança vira um pingo a mais pra causa.`,
    ctaLabel: "Ver a campanha",
    ctaUrl: ({ campaignUrl }) => campaignUrl,
  },
  payment_failed: {
    preview: "Não conseguimos cobrar seu cartão",
    heading: (name) => `Oi ${name}, deu um problema com o cartão`,
    intro: (title, amount) =>
      `A cobrança de ${amount} da sua doação mensal pra "${title}" não foi aprovada. Pode ter sido limite, validade vencida ou um bloqueio temporário do seu banco.`,
    body: () =>
      "Vamos tentar de novo automaticamente nos próximos dias. Mas se você quiser atualizar o cartão agora, é mais rápido — só acessar seu painel.",
    ctaLabel: "Atualizar cartão",
    ctaUrl: ({ manageUrl, campaignUrl }) => manageUrl ?? campaignUrl,
  },
  canceled: {
    preview: "Sua doação mensal foi cancelada",
    heading: (name) => `Cancelamento confirmado, ${name}`,
    intro: (title, amount) =>
      `Cancelamos sua doação mensal de ${amount} pra "${title}". Você não vai ser mais cobrado, e qualquer pessoa não fica sabendo do cancelamento.`,
    body: () =>
      "Obrigado por ter ajudado enquanto durou. Quando puder e quiser voltar a apoiar, a gente está aqui.",
    ctaLabel: "Ver outras causas",
    ctaUrl: ({ campaignUrl }) => {
      try {
        const u = new URL(campaignUrl);
        return `${u.origin}/explorar`;
      } catch {
        return "https://doatividade.com/explorar";
      }
    },
  },
  winback: {
    preview: "Sentimos sua falta — a causa que você apoiava continua",
    heading: (name) => `Oi ${name}, voltando a falar com você`,
    intro: (title) =>
      `Faz um tempo que você cancelou a doação mensal pra "${title}". A campanha continua precisando de apoio, e a gente queria saber se você toparia voltar.`,
    body: () =>
      "Sem pressão e sem culpa. Se voltar, ótimo; se não, tudo bem também — você continua fazendo parte dessa rede.",
    ctaLabel: "Ver a campanha",
    ctaUrl: ({ campaignUrl }) => campaignUrl,
  },
};

/* ─── Estilos ─── */
const body: React.CSSProperties = {
  backgroundColor: "#f4f6fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};
const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e9f2",
  borderRadius: 16,
  margin: "0 auto",
  maxWidth: 560,
  padding: "32px 36px",
};
const brand: React.CSSProperties = { marginBottom: 12 };
const brandText: React.CSSProperties = {
  color: "#1d2842",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: 0,
  textTransform: "uppercase",
};
const h1: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.2,
  margin: "8px 0 16px",
};
const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.6,
  margin: "0 0 16px",
};
const muted: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.6,
  margin: "16px 0 0",
};
const link: React.CSSProperties = { color: "#2563eb", textDecoration: "underline" };
const ctaWrap: React.CSSProperties = { margin: "20px 0 8px" };
const button: React.CSSProperties = {
  backgroundColor: "#1d2842",
  borderRadius: 10,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};
const infoBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  margin: "8px 0 16px",
  padding: "12px 16px",
};
const alertBox: React.CSSProperties = {
  backgroundColor: "#fef3f2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  margin: "8px 0 16px",
  padding: "12px 16px",
};
const infoLine: React.CSSProperties = {
  color: "#334155",
  fontSize: 14,
  margin: "4px 0",
};
const alertLine: React.CSSProperties = {
  color: "#991b1b",
  fontSize: 14,
  margin: "4px 0",
};
const hr: React.CSSProperties = {
  borderColor: "#e5e9f2",
  margin: "24px 0 16px",
};
const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
};
