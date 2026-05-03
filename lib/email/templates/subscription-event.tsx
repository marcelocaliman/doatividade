import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  donorName: string;
  donorFirstName: string;
  campaignTitle: string;
  campaignUrl: string;
  amountFormatted: string;
  variant: "welcome" | "renewed" | "payment_failed" | "canceled" | "winback";
  manageUrl?: string | null;
  nextChargeAt?: string | null;
  failureReason?: string | null;
  /** Branding do criador */
  creatorName: string;
  creatorInitials: string;
  creatorLogoUrl: string | null;
  /** App URL pra footer */
  appUrl: string;
};

/* Email de evento de subscription. Igual ao recibo avulso, é assinado
 * pelo CRIADOR (não pela Doatividade). Doatividade só aparece no
 * footer como plataforma de pagamento. */
export function SubscriptionEventEmail({
  donorFirstName,
  campaignTitle,
  campaignUrl,
  amountFormatted,
  variant,
  manageUrl,
  nextChargeAt,
  failureReason,
  creatorName,
  creatorInitials,
  creatorLogoUrl,
  appUrl,
}: Props) {
  const copy = COPY[variant];

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{copy.preview(creatorName, amountFormatted)}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header com branding do criador */}
          <Section style={headerSection}>
            {creatorLogoUrl ? (
              <Img
                src={creatorLogoUrl}
                width="56"
                height="56"
                alt={creatorName}
                style={creatorLogoImg}
              />
            ) : (
              <div style={initialsBox}>{creatorInitials}</div>
            )}
            <Text style={creatorLabel}>{creatorName}</Text>
          </Section>

          <Heading style={h1}>{copy.heading(donorFirstName)}</Heading>

          <Text style={paragraph}>
            {copy.intro(campaignTitle, amountFormatted, creatorName)}
          </Text>

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
              {copy.body(campaignTitle, amountFormatted, creatorName)}
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

          {variant !== "payment_failed" && variant !== "winback" ? (
            <Text style={signature}>
              Com gratidão,
              <br />
              <strong>{creatorName}</strong>
            </Text>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Mensagem enviada pela{" "}
            <Link href={appUrl} style={footerLink}>
              Doatividade
            </Link>{" "}
            — plataforma de doação online. Sua doação mensal vai diretamente
            para {creatorName}; a Doatividade apenas processa o pagamento.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

type CopyEntry = {
  preview: (creator: string, amount: string) => string;
  heading: (firstName: string) => string;
  intro: (title: string, amount: string, creator: string) => string;
  body?: (title: string, amount: string, creator: string) => string;
  ctaLabel: string;
  ctaUrl: (urls: { campaignUrl: string; manageUrl?: string | null }) => string;
};

const COPY: Record<Props["variant"], CopyEntry> = {
  welcome: {
    preview: (creator, amount) =>
      `${creator} agradece sua doação mensal de ${amount}`,
    heading: (name) => `Bem-vindo, ${name} 💙`,
    intro: (title, amount, creator) =>
      `Sua doação mensal de ${amount} pra "${title}" foi confirmada. Todo mês, no mesmo dia, ${creator} recebe sua contribuição automaticamente — sem você precisar lembrar de nada.`,
    body: (_t, _a, creator) =>
      `É um apoio contínuo que muda o dia-a-dia da causa. ${creator} agradece de coração. Cancele a qualquer momento, sem burocracia.`,
    ctaLabel: "Ver a campanha",
    ctaUrl: ({ campaignUrl }) => campaignUrl,
  },
  renewed: {
    preview: (creator, amount) =>
      `${creator} acabou de receber sua doação mensal de ${amount}`,
    heading: (name) => `Obrigado de novo, ${name}!`,
    intro: (title, amount) =>
      `Mais uma doação mensal de ${amount} pra "${title}" caiu agora. Cada cobrança vira um pingo a mais pra causa continuar.`,
    ctaLabel: "Ver a campanha",
    ctaUrl: ({ campaignUrl }) => campaignUrl,
  },
  payment_failed: {
    preview: () => "Não conseguimos cobrar seu cartão",
    heading: (name) => `Oi ${name}, deu um problema com o cartão`,
    intro: (title, amount) =>
      `A cobrança de ${amount} da sua doação mensal pra "${title}" não foi aprovada. Pode ter sido limite, validade vencida ou um bloqueio temporário do seu banco.`,
    body: () =>
      "Vamos tentar de novo automaticamente nos próximos dias. Se quiser atualizar o cartão agora, é só acessar seu painel.",
    ctaLabel: "Atualizar cartão",
    ctaUrl: ({ manageUrl, campaignUrl }) => manageUrl ?? campaignUrl,
  },
  canceled: {
    preview: () => "Sua doação mensal foi cancelada",
    heading: (name) => `Cancelamento confirmado, ${name}`,
    intro: (title, amount) =>
      `Cancelamos sua doação mensal de ${amount} pra "${title}". Você não vai ser mais cobrado.`,
    body: (_t, _a, creator) =>
      `${creator} agradece muito por ter ajudado enquanto durou. Quando quiser voltar a apoiar, é só voltar pra página da campanha.`,
    ctaLabel: "Ver outras causas",
    ctaUrl: ({ campaignUrl }) => {
      try {
        const u = new URL(campaignUrl);
        return `${u.origin}/explorar`;
      } catch {
        return "https://www.doatividade.com/explorar";
      }
    },
  },
  winback: {
    preview: (creator) => `${creator} sentiu sua falta`,
    heading: (name) => `Oi ${name}, voltando a falar com você`,
    intro: (title, _amount, creator) =>
      `Faz um tempo que você cancelou a doação mensal pra "${title}". A causa segue precisando, e ${creator} queria saber se você toparia voltar.`,
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
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
const headerSection: React.CSSProperties = {
  marginBottom: 24,
  textAlign: "center" as const,
};
const creatorLogoImg: React.CSSProperties = {
  borderRadius: "50%",
  display: "block",
  margin: "0 auto",
  objectFit: "cover" as const,
};
const initialsBox: React.CSSProperties = {
  alignItems: "center",
  backgroundColor: "#13283E",
  borderRadius: "50%",
  color: "#ffffff",
  display: "flex",
  fontSize: 22,
  fontWeight: 700,
  height: 56,
  justifyContent: "center",
  margin: "0 auto",
  width: 56,
};
const creatorLabel: React.CSSProperties = {
  color: "#13283E",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.02em",
  margin: "12px 0 0",
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
const link: React.CSSProperties = { color: "#13283E", textDecoration: "underline" };
const ctaWrap: React.CSSProperties = { margin: "20px 0 8px", textAlign: "center" as const };
const button: React.CSSProperties = {
  backgroundColor: "#13283E",
  borderRadius: 10,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};
const signature: React.CSSProperties = {
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.5,
  margin: "20px 0 0",
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
  margin: "28px 0 18px",
};
const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  lineHeight: 1.55,
  margin: 0,
};
const footerLink: React.CSSProperties = {
  color: "#64748b",
  textDecoration: "underline",
};
