import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  magicUrl: string;
};

export function DonorAccessLinkEmail({ magicUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Acesse suas doações mensais</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>Doatividade</Text>
          </Section>

          <Heading style={h1}>Seu link de acesso</Heading>
          <Text style={paragraph}>
            Use o botão abaixo pra ver, atualizar o cartão ou cancelar suas
            doações mensais. O link vale por 24 horas.
          </Text>

          <Section style={ctaWrap}>
            <Button style={button} href={magicUrl}>
              Abrir minhas doações
            </Button>
          </Section>

          <Text style={muted}>
            Se você não pediu esse email, pode ignorar — o link não é usado se
            ninguém clicar.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>Doatividade · plataforma brasileira de vaquinhas online.</Text>
        </Container>
      </Body>
    </Html>
  );
}

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
