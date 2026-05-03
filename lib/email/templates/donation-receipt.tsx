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
import { formatBRL } from "@/lib/utils/format";

type Props = {
  donorName: string;
  donorFirstName: string;
  campaignTitle: string;
  campaignUrl: string;
  totalChargedCents: number;
  appUrl: string;
  /** Branding do criador */
  creatorName: string;
  creatorInitials: string;
  creatorLogoUrl: string | null;
  creatorMessage?: string | null;
};

/* Recibo de doação avulsa. Assinado pelo CRIADOR (não pela Doatividade).
 * Doatividade aparece só num rodapé discreto como "plataforma que processou". */
export function DonationReceiptEmail({
  donorFirstName,
  campaignTitle,
  campaignUrl,
  totalChargedCents,
  appUrl,
  creatorName,
  creatorInitials,
  creatorLogoUrl,
  creatorMessage,
}: Props) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {creatorName} agradece sua doação de {formatBRL(totalChargedCents)}
      </Preview>
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

          <Heading style={h1}>Obrigado, {donorFirstName} 💙</Heading>

          <Text style={paragraph}>
            Sua doação de <strong>{formatBRL(totalChargedCents)}</strong> pra{" "}
            <strong>{campaignTitle}</strong> chegou aqui — e cada centavo conta.
          </Text>

          {creatorMessage ? (
            <Section style={messageBox}>
              <Text style={messageText}>&ldquo;{creatorMessage}&rdquo;</Text>
              <Text style={messageSig}>— {creatorName}</Text>
            </Section>
          ) : (
            <Text style={paragraph}>
              Vou fazer cada real chegar onde mais importa. Obrigado de coração
              por fazer parte dessa causa.
            </Text>
          )}

          <Section style={amountBox}>
            <Text style={amountLabel}>Valor da sua doação</Text>
            <Text style={amountValue}>{formatBRL(totalChargedCents)}</Text>
          </Section>

          <Section style={ctaWrap}>
            <Button href={campaignUrl} style={button}>
              Ver a campanha
            </Button>
          </Section>

          <Text style={paragraph}>
            Se quiser conversar, é só responder esse email — chega direto pra
            mim.
          </Text>

          <Text style={signature}>
            Com gratidão,
            <br />
            <strong>{creatorName}</strong>
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Recibo gerado pela{" "}
            <Link href={appUrl} style={footerLink}>
              Doatividade
            </Link>{" "}
            — plataforma de doação online. A Doatividade é apenas o
            intermediário que processa o pagamento; sua doação foi feita
            diretamente para {creatorName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ─── Estilos inline (compat máxima com clientes de email) ─── */
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
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.2,
  margin: "8px 0 16px",
};
const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.65,
  margin: "0 0 16px",
};
const messageBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderLeft: "3px solid #13283E",
  borderRadius: 6,
  margin: "8px 0 20px",
  padding: "16px 18px",
};
const messageText: React.CSSProperties = {
  color: "#1e293b",
  fontSize: 15,
  fontStyle: "italic" as const,
  lineHeight: 1.6,
  margin: 0,
};
const messageSig: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  margin: "8px 0 0",
};
const amountBox: React.CSSProperties = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: 12,
  margin: "16px 0",
  padding: "16px 20px",
  textAlign: "center" as const,
};
const amountLabel: React.CSSProperties = {
  color: "#0369a1",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.06em",
  margin: 0,
  textTransform: "uppercase" as const,
};
const amountValue: React.CSSProperties = {
  color: "#13283E",
  fontFamily:
    '"SF Mono", Monaco, Menlo, "Roboto Mono", "Courier New", monospace',
  fontSize: 28,
  fontWeight: 700,
  margin: "6px 0 0",
};
const ctaWrap: React.CSSProperties = { margin: "20px 0", textAlign: "center" as const };
const button: React.CSSProperties = {
  backgroundColor: "#13283E",
  borderRadius: 10,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};
const signature: React.CSSProperties = {
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.5,
  margin: "20px 0 0",
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
