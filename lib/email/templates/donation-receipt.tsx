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
  Tailwind,
  Text,
} from "@react-email/components";
import { formatBRL } from "@/lib/utils/format";

type Props = {
  donorName: string;
  campaignTitle: string;
  campaignUrl: string;
  totalChargedCents: number;
  appUrl: string;
};

export function DonationReceiptEmail({
  donorName,
  campaignTitle,
  campaignUrl,
  totalChargedCents,
  appUrl,
}: Props) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        Recebemos sua doação de {formatBRL(totalChargedCents)} para{" "}
        {campaignTitle}.
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-50 py-10 font-sans">
          <Container className="mx-auto max-w-[560px] rounded-2xl border border-zinc-200 bg-white p-8">
            <Section>
              <Img
                src={`${appUrl}/icon.png`}
                width="32"
                height="32"
                alt="Doatividade"
                className="rounded-md"
              />
            </Section>

            <Heading as="h1" className="mt-6 text-2xl font-semibold text-zinc-900">
              Obrigado, {donorName} 💚
            </Heading>

            <Text className="mt-3 text-base leading-relaxed text-zinc-700">
              Recebemos sua doação para{" "}
              <strong className="text-zinc-900">{campaignTitle}</strong>. Sua
              ajuda faz toda a diferença.
            </Text>

            <Section className="mt-6 rounded-xl border border-zinc-200 p-5">
              <Text className="m-0 text-sm text-zinc-500">
                Valor da doação
              </Text>
              <Text className="m-0 mt-1 text-2xl font-semibold text-emerald-600">
                {formatBRL(totalChargedCents)}
              </Text>
            </Section>

            <Section className="mt-6 text-center">
              <Button
                href={campaignUrl}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white"
              >
                Ver campanha
              </Button>
            </Section>

            <Hr className="my-8 border-zinc-200" />

            <Text className="text-xs leading-relaxed text-zinc-500">
              Este é um email automático de confirmação. Se você não fez esta
              doação, ignore esta mensagem ou nos avise em{" "}
              <Link href="mailto:contato@doatividade.com.br" className="text-emerald-700">
                contato@doatividade.com.br
              </Link>
              .
            </Text>

            <Text className="mt-4 text-xs text-zinc-400">
              Doatividade — A menor taxa do Brasil para doações via Pix.
              <br />
              <Link href={appUrl} className="text-zinc-500">
                {appUrl.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DonationReceiptEmail;
