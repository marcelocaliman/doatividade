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
  userName: string;
  stageLabel: string;
  bodyMessage: string;
  ctaLabel: string;
  ctaUrl: string;
  appUrl: string;
};

export function FunnelReminderEmail({
  userName,
  stageLabel,
  bodyMessage,
  ctaLabel,
  ctaUrl,
  appUrl,
}: Props) {
  const firstName = userName.split(" ")[0] ?? userName;
  return (
    <Html>
      <Head />
      <Preview>{stageLabel} — falta pouco pra começar</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>Doatividade</Text>
          </Section>

          <Heading style={h1}>Oi {firstName} 👋</Heading>

          <Text style={paragraph}>{bodyMessage}</Text>

          <Section style={ctaWrap}>
            <Button style={button} href={ctaUrl}>
              {ctaLabel}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você está recebendo isso porque criou conta na Doatividade. Se não
            quer mais lembretes, é só{" "}
            <Link
              href={`${appUrl}/configuracoes/notificacoes`}
              style={footerLink}
            >
              ajustar nas configurações
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f4f4f5", fontFamily: "system-ui, sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  borderRadius: "12px",
};
const brand = { marginBottom: "24px" };
const brandText = {
  color: "#1d2842",
  fontSize: "16px",
  fontWeight: 700,
  margin: 0,
};
const h1 = {
  color: "#0a0a0a",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 16px",
};
const paragraph = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.55",
  margin: "0 0 24px",
};
const ctaWrap = { margin: "12px 0 32px" };
const button = {
  backgroundColor: "#1d2842",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 20px",
  display: "inline-block",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
};
const footerLink = { color: "#1d2842", textDecoration: "underline" };
