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

type Props = {
  creatorName: string;
  campaignTitle: string;
  campaignUrl: string;
  appUrl: string;
};

export function CampaignPublishedEmail({
  creatorName,
  campaignTitle,
  campaignUrl,
  appUrl,
}: Props) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{campaignTitle} está no ar! Compartilha pra começar.</Preview>
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

            <Heading
              as="h1"
              className="mt-6 text-2xl font-semibold text-zinc-900"
            >
              Sua campanha está no ar! 🚀
            </Heading>

            <Text className="mt-3 text-base leading-relaxed text-zinc-700">
              {creatorName}, parabéns. <strong>{campaignTitle}</strong> agora
              está pública e pronta pra receber doações.
            </Text>

            <Section className="mt-6 text-center">
              <Button
                href={campaignUrl}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white"
              >
                Ver minha campanha
              </Button>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Heading
              as="h2"
              className="text-lg font-semibold text-zinc-900"
            >
              Próximos passos pra arrecadar mais
            </Heading>

            <Section className="mt-3">
              <Text className="m-0 mb-2 text-sm font-medium text-zinc-900">
                1. Compartilhe nas redes
              </Text>
              <Text className="m-0 text-sm text-zinc-700">
                WhatsApp tem a melhor conversão pra doações. Manda pra grupos
                de família, amigos, bairro.
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 mb-2 text-sm font-medium text-zinc-900">
                2. Conte uma boa história
              </Text>
              <Text className="m-0 text-sm text-zinc-700">
                Posts com fotos e atualizações regulares mantêm a campanha
                viva. Use o link da página direto no story do Instagram.
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 mb-2 text-sm font-medium text-zinc-900">
                3. Agradeça os doadores
              </Text>
              <Text className="m-0 text-sm text-zinc-700">
                Quem doa cedo é quem mais vai compartilhar. Mande mensagem
                pessoal — faz diferença.
              </Text>
            </Section>

            <Hr className="my-8 border-zinc-200" />

            <Text className="text-xs leading-relaxed text-zinc-500">
              Doatividade — A menor taxa do Brasil para doações via Pix.
              <br />
              Acompanhe sua campanha no{" "}
              <Link
                href={`${appUrl}/dashboard`}
                className="text-emerald-700"
              >
                dashboard
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default CampaignPublishedEmail;
