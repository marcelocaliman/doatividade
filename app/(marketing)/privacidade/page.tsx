import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata = {
  title: "Política de Privacidade — Doatividade",
};

const SECTIONS: LegalSection[] = [
  {
    id: "introducao",
    title: "Introdução e escopo",
    content: (
      <>
        <p>
          A <strong>Doatividade</strong> respeita a sua privacidade e leva a
          proteção dos seus dados pessoais a sério. Esta Política de Privacidade
          explica de forma clara e detalhada quais dados coletamos, por que
          coletamos, como usamos, com quem compartilhamos, por quanto tempo
          guardamos e quais são os seus direitos.
        </p>
        <p>
          Esta política se aplica a todos os usuários da plataforma —
          Criadores de campanhas, Doadores e visitantes — e cumpre integralmente
          a <strong>Lei Geral de Proteção de Dados</strong> (LGPD, Lei
          13.709/2018) e o <strong>Marco Civil da Internet</strong> (Lei
          12.965/2014).
        </p>
        <p>
          A Doatividade é a <strong>controladora</strong> dos dados pessoais
          coletados diretamente nesta plataforma. Para fins de pagamento, a
          Stripe atua como controladora independente dos dados financeiros que
          ela própria coleta (CPF/CNPJ, dados bancários, comprovantes
          KYC) — consulte a{" "}
          <a
            href="https://stripe.com/br/privacy"
            target="_blank"
            rel="noreferrer"
          >
            política de privacidade da Stripe
          </a>{" "}
          para esses dados.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "Dados que coletamos",
    content: (
      <>
        <h3>Criador de campanha</h3>
        <ul>
          <li>
            <strong>Cadastro</strong>: nome completo, email, foto de perfil
            (caso entre via Google), senha (hash quando uso email/senha).
          </li>
          <li>
            <strong>Perfil opcional</strong>: nome de organização, CNPJ, logo,
            biografia, links de redes sociais.
          </li>
          <li>
            <strong>Conteúdo de campanha</strong>: título, descrição, fotos,
            galeria, atualizações, mensagem de agradecimento.
          </li>
          <li>
            <strong>Dados financeiros (Stripe)</strong>: CPF/CNPJ, endereço,
            dados bancários, documentos KYC. Esses dados são coletados e
            armazenados pela Stripe, não pela Doatividade. Recebemos apenas
            <strong> status agregado</strong> (cadastro completo, payouts
            habilitados, etc) via webhook.
          </li>
        </ul>

        <h3>Doador</h3>
        <ul>
          <li>
            <strong>Identificação no checkout</strong>: nome (ou opção
            &ldquo;anônimo&rdquo;), email (para envio do recibo), mensagem
            opcional ao criador.
          </li>
          <li>
            <strong>Dados de pagamento</strong>: número do cartão, validade,
            CVC, ou QR Pix — todos processados <strong>exclusivamente pela
            Stripe</strong>. A Doatividade nunca tem acesso, armazenamento ou
            processamento de dados de cartão (compliance PCI-DSS é
            responsabilidade da Stripe).
          </li>
          <li>
            <strong>Comprovante</strong>: ID da transação Stripe e valor —
            armazenamos para emissão de recibo e histórico do criador.
          </li>
        </ul>

        <h3>Dados técnicos (todos os usuários)</h3>
        <ul>
          <li>
            <strong>Endereço IP</strong>, navegador (user-agent), sistema
            operacional, tipo de dispositivo, idioma.
          </li>
          <li>
            <strong>Logs de acesso</strong> a campanhas (data/hora, página
            acessada) — retidos por 6 meses conforme art. 15 do Marco Civil
            da Internet.
          </li>
          <li>
            <strong>Cookies</strong>: estritamente os necessários para
            autenticação e operação. Veja seção{" "}
            <a href="#cookies">Cookies</a>.
          </li>
          <li>
            <strong>Erros e performance</strong>: capturamos stack traces e
            métricas via Sentry para debugar problemas (sem PII identificável).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "bases-legais",
    title: "Bases legais (LGPD)",
    content: (
      <>
        <p>
          Tratamos dados pessoais com base nas seguintes hipóteses legais
          previstas no art. 7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>Execução de contrato</strong> (art. 7º, V): para operar a
            plataforma, processar doações e cumprir nossa relação com o usuário
            (cadastro, criação de campanha, payouts).
          </li>
          <li>
            <strong>Cumprimento de obrigação legal ou regulatória</strong>{" "}
            (art. 7º, II): para reter dados de transações pelo prazo fiscal
            (5 anos), atender ordens judiciais, prevenir fraude e lavagem de
            dinheiro (Lei 9.613/1998).
          </li>
          <li>
            <strong>Legítimo interesse</strong> (art. 7º, IX): para garantir
            segurança da plataforma, prevenir fraudes, melhorar a experiência
            de uso (analytics agregado), enviar emails transacionais
            indispensáveis. Sempre balanceado com seus direitos.
          </li>
          <li>
            <strong>Consentimento</strong> (art. 7º, I): para envio opcional de
            atualizações de campanhas que você favoritou ou doou (você pode
            desativar nas <Link href="/configuracoes/notificacoes">configurações</Link>).
          </li>
          <li>
            <strong>Tutela da saúde / proteção da vida</strong> (art. 7º, III e
            VII): em casos extremos de campanhas relacionadas a tratamentos
            médicos urgentes, podemos ter base ampliada.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Como usamos seus dados",
    content: (
      <>
        <p>Usamos os dados coletados estritamente para:</p>
        <ul>
          <li>
            <strong>Operar a plataforma</strong>: autenticar acesso, exibir
            campanhas, processar doações, emitir recibos, gerar relatórios para
            o criador.
          </li>
          <li>
            <strong>Comunicar</strong>: enviar emails transacionais (recibo de
            doação, confirmação de cadastro, atualização de campanha quando
            você doou e não optou por anônimo, alertas de moderação).
          </li>
          <li>
            <strong>Cumprir obrigações legais</strong>: atender requisições de
            autoridades (Polícia Federal, Receita Federal, MP), reter dados
            fiscais por 5 anos, prevenir lavagem de dinheiro.
          </li>
          <li>
            <strong>Prevenir fraude</strong>: detectar campanhas duplicadas,
            análise antifraude da Stripe, marcação de contas suspeitas, KYC
            escalonado.
          </li>
          <li>
            <strong>Melhorar a plataforma</strong>: analytics agregado e
            anonimizado para entender quais funcionalidades funcionam.
          </li>
        </ul>
        <p>
          <strong>Não fazemos:</strong>
        </p>
        <ul>
          <li>
            <strong>Não vendemos</strong> seus dados para nenhum terceiro, em
            nenhuma hipótese.
          </li>
          <li>
            <strong>Não usamos</strong> seus dados para marketing de terceiros,
            anúncios direcionados, perfilamento comercial ou tomada de decisão
            automatizada com efeitos jurídicos.
          </li>
          <li>
            <strong>Não enviamos</strong> emails promocionais sem
            consentimento explícito.
          </li>
          <li>
            <strong>Não compartilhamos</strong> com redes sociais (não temos
            Facebook Pixel, TikTok Pixel, Google Ads, etc).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento com terceiros",
    content: (
      <>
        <p>
          Compartilhamos dados <strong>apenas com fornecedores essenciais</strong>{" "}
          à operação, sob contratos de processador de dados:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> (processamento de pagamento e Connect) —
            sediada nos EUA, processa CPF/CNPJ, dados bancários, transações,
            faz KYC e payouts. Possui certificação PCI-DSS Level 1 e
            decisões de adequação reconhecidas pela ANPD.{" "}
            <a
              href="https://stripe.com/br/legal/dpa"
              target="_blank"
              rel="noreferrer"
            >
              Ver DPA da Stripe
            </a>
            .
          </li>
          <li>
            <strong>Supabase</strong> (banco de dados e autenticação) — hospeda
            o banco PostgreSQL com nossos dados. Servidores na região
            us-east-1 (AWS), com criptografia em repouso e em trânsito.
          </li>
          <li>
            <strong>Vercel</strong> (hospedagem da aplicação) — serve as
            páginas da Doatividade. Logs de acesso (IP, request) ficam por até
            7 dias no edge da Vercel.
          </li>
          <li>
            <strong>Resend</strong> (envio de emails transacionais) — processa
            email + nome para entregar mensagens. Sem uso para marketing.
          </li>
          <li>
            <strong>Sentry</strong> (monitoramento de erros) — captura stack
            traces sem PII para debugar bugs.
          </li>
          <li>
            <strong>Google</strong> (OAuth) — quando você escolhe entrar com
            Google, recebemos nome, email e foto de perfil que você autoriza.
            Não recebemos sua senha.
          </li>
          <li>
            <strong>Autoridades competentes</strong> — apenas mediante
            requisição formal e fundamentada, ou para cumprir obrigação legal
            (ex: ordem judicial, requisição da Receita Federal, denúncia
            criminal).
          </li>
        </ul>
        <p>
          Em caso de <strong>fusão, aquisição ou venda de ativos</strong> da
          Doatividade, dados pessoais podem ser transferidos ao adquirente,
          mantendo-se as proteções desta política. Notificaremos com pelo menos
          30 dias de antecedência.
        </p>
      </>
    ),
  },
  {
    id: "transferencia-internacional",
    title: "Transferência internacional de dados",
    content: (
      <>
        <p>
          Alguns dos nossos fornecedores essenciais (Stripe, Vercel, Supabase,
          Sentry) operam servidores fora do Brasil — geralmente nos Estados
          Unidos e União Europeia. A transferência internacional desses dados
          obedece ao art. 33 da LGPD e ocorre porque:
        </p>
        <ul>
          <li>
            é <strong>necessária à execução do contrato</strong> com você (sem
            esses processadores, não há plataforma);
          </li>
          <li>
            os fornecedores adotam <strong>cláusulas contratuais</strong> de
            proteção compatíveis com a LGPD (Standard Contractual Clauses) e,
            quando aplicável, possuem certificações reconhecidas (PCI-DSS,
            SOC 2 Type II, ISO 27001);
          </li>
          <li>
            mantemos contratos de processador de dados (DPA) com cada um deles.
          </li>
        </ul>
        <p>
          Você pode solicitar a lista completa de transferências e cópias dos
          DPAs por email.
        </p>
      </>
    ),
  },
  {
    id: "seus-direitos",
    title: "Seus direitos como titular",
    content: (
      <>
        <p>
          Conforme o art. 18 da LGPD, você pode a qualquer momento exercer
          os seguintes direitos sobre seus dados pessoais:
        </p>
        <ul>
          <li>
            <strong>Confirmação e acesso</strong> — saber quais dados temos
            sobre você e receber cópia.
          </li>
          <li>
            <strong>Correção</strong> — atualizar dados incompletos, inexatos
            ou desatualizados.
          </li>
          <li>
            <strong>Anonimização, bloqueio ou eliminação</strong> de dados
            desnecessários ou tratados em desconformidade com a LGPD.
          </li>
          <li>
            <strong>Portabilidade</strong> — receber seus dados em formato
            estruturado, comumente usado e legível por máquina (JSON ou CSV).
          </li>
          <li>
            <strong>Eliminação</strong> de dados tratados com base em
            consentimento (exceto os exigidos por lei para retenção fiscal,
            de auditoria ou prevenção a fraude).
          </li>
          <li>
            <strong>Informação sobre compartilhamento</strong> — quais entidades
            recebem seus dados.
          </li>
          <li>
            <strong>Revogação do consentimento</strong> dado anteriormente,
            quando essa for a base legal.
          </li>
          <li>
            <strong>Oposição</strong> ao tratamento que você considere
            inadequado ou desnecessário.
          </li>
          <li>
            <strong>Revisão de decisões automatizadas</strong> — não tomamos
            decisões inteiramente automatizadas com efeitos jurídicos sobre
            você (não há perfilamento ou scoring automático que afete acesso
            ou serviços).
          </li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, envie email para{" "}
          <a href="mailto:contato@doatividade.com">
            contato@doatividade.com
          </a>{" "}
          identificando-se. Respondemos em <strong>até 15 dias</strong>{" "}
          conforme o art. 19 da LGPD. Em casos complexos, podemos prorrogar
          por mais 30 dias mediante justificativa.
        </p>
        <p>
          Algumas funcionalidades estão disponíveis diretamente na plataforma:
        </p>
        <ul>
          <li>
            <strong>Exportar histórico de doações</strong>:{" "}
            <Link href="/configuracoes/privacidade">/configuracoes/privacidade</Link>
          </li>
          <li>
            <strong>Editar perfil</strong>:{" "}
            <Link href="/configuracoes">/configuracoes</Link>
          </li>
          <li>
            <strong>Solicitar exclusão</strong>:{" "}
            <Link href="/configuracoes/privacidade">/configuracoes/privacidade</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retencao",
    title: "Retenção e exclusão de dados",
    content: (
      <>
        <p>Mantemos seus dados apenas pelo tempo necessário, conforme:</p>
        <ul>
          <li>
            <strong>Dados de cadastro de Criador</strong>: enquanto a conta
            estiver ativa. Após encerramento, anonimizamos perfil em até 90 dias,
            mantendo apenas o ID interno para integridade referencial dos
            registros financeiros.
          </li>
          <li>
            <strong>Campanhas e doações</strong>: <strong>5 anos</strong> a
            partir da data da última transação, conforme exigências fiscais
            (art. 195 do CTN) e de prevenção à lavagem de dinheiro (Lei
            9.613/1998).
          </li>
          <li>
            <strong>Logs de acesso</strong>: <strong>6 meses</strong>, conforme
            art. 15 do Marco Civil da Internet.
          </li>
          <li>
            <strong>Logs de aplicação (Sentry)</strong>: <strong>30 dias</strong>.
          </li>
          <li>
            <strong>Emails transacionais enviados</strong>: 90 dias
            (provedor: Resend).
          </li>
          <li>
            <strong>Notificações in-app</strong>: enquanto não forem apagadas
            pelo usuário (você pode limpar via{" "}
            <Link href="/notificacoes">/notificacoes</Link>).
          </li>
        </ul>
        <p>
          Após o prazo de retenção, dados são excluídos definitivamente ou
          anonimizados de forma irreversível.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e tecnologias similares",
    content: (
      <>
        <p>Usamos apenas cookies estritamente necessários:</p>
        <ul>
          <li>
            <strong>Cookies de autenticação</strong> (Supabase Auth): mantêm
            sua sessão ativa após login. Sem eles, você precisaria logar a
            cada navegação.
          </li>
          <li>
            <strong>Cookies de preferência</strong>: armazenam configurações
            visuais simples (ex: tema), localmente no seu dispositivo.
          </li>
          <li>
            <strong>Stripe</strong>: pode setar cookies próprios durante o
            checkout para detecção de fraude (ex: <code>__stripe_mid</code>).
            Esses cookies são da Stripe — consulte{" "}
            <a
              href="https://stripe.com/cookies-policy/legal"
              target="_blank"
              rel="noreferrer"
            >
              política de cookies da Stripe
            </a>
            .
          </li>
        </ul>
        <p>
          <strong>Não usamos:</strong> Google Analytics, Facebook Pixel,
          TikTok Pixel, cookies de tracking publicitário ou de retargeting.
          Seu comportamento na plataforma não é vendido nem compartilhado
          com redes de anúncios.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "Crianças e adolescentes",
    content: (
      <>
        <p>
          A plataforma <strong>não é direcionada a menores de 18 anos</strong>.
          O cadastro como Criador exige idade mínima de 18 anos (exigência da
          Stripe e da legislação brasileira para abertura de conta de
          recebimento).
        </p>
        <p>
          Doadores menores de 18 podem realizar doações com{" "}
          <strong>autorização e supervisão dos pais ou responsáveis legais</strong>,
          que assumem a responsabilidade pela transação.
        </p>
        <p>
          Se identificarmos cadastro indevido de menor, suspenderemos a conta
          e excluiremos os dados em até 30 dias, conforme art. 14 da LGPD.
        </p>
        <p>
          Campanhas <strong>em benefício</strong> de menores (ex: tratamento
          médico de criança) são permitidas, com autorização documentada dos
          pais e ocultação de dados sensíveis (sobrenome completo, escola,
          endereço) na página pública.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança da informação",
    content: (
      <>
        <p>Aplicamos medidas técnicas e organizacionais razoáveis:</p>
        <ul>
          <li>
            <strong>HTTPS obrigatório</strong> em toda a aplicação (TLS 1.3+).
          </li>
          <li>
            <strong>Criptografia em repouso</strong> dos dados no banco
            (Supabase, AES-256).
          </li>
          <li>
            <strong>Senhas armazenadas como hash</strong> (bcrypt) — nunca em
            texto puro. A Doatividade jamais sabe sua senha.
          </li>
          <li>
            <strong>Row Level Security</strong> (RLS) no banco PostgreSQL —
            cada usuário só pode acessar seus próprios dados via API.
          </li>
          <li>
            <strong>Tokens com expiração</strong> e renovação automática.
          </li>
          <li>
            <strong>Audit log</strong> de todas as ações administrativas.
          </li>
          <li>
            <strong>Princípio do menor privilégio</strong> entre serviços
            internos.
          </li>
          <li>
            <strong>Atualizações periódicas</strong> de dependências
            (Dependabot, npm audit).
          </li>
        </ul>
        <p>
          Em caso de <strong>incidente de segurança</strong> que possa
          acarretar risco ou dano relevante aos titulares, notificaremos a{" "}
          <a
            href="https://www.gov.br/anpd/pt-br"
            target="_blank"
            rel="noreferrer"
          >
            ANPD
          </a>{" "}
          e os titulares afetados em prazo razoável (objetivo: até 72 horas
          após confirmação), conforme art. 48 da LGPD.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações desta política",
    content: (
      <>
        <p>
          Esta política pode ser atualizada para refletir mudanças legais,
          operacionais ou tecnológicas. Mudanças relevantes serão comunicadas
          com <strong>pelo menos 15 dias de antecedência</strong> por email
          para sua conta cadastrada e por aviso visível na plataforma.
        </p>
        <p>
          Mudanças menores (correções de redação, atualização de fornecedores)
          podem entrar em vigor imediatamente, com registro na data de
          última atualização no topo do documento.
        </p>
      </>
    ),
  },
  {
    id: "encarregado",
    title: "Encarregado de dados (DPO) e contato",
    content: (
      <>
        <p>
          Conforme exige o art. 41 da LGPD, designamos um Encarregado pelo
          tratamento de dados pessoais:
        </p>
        <ul>
          <li>
            <strong>Encarregado (DPO)</strong>: Marcelo Caliman
          </li>
          <li>
            <strong>Email</strong>:{" "}
            <a href="mailto:contato@doatividade.com">
              contato@doatividade.com
            </a>
          </li>
          <li>
            <strong>Tempo de resposta</strong>: até 15 dias para qualquer
            assunto relacionado a dados pessoais.
          </li>
        </ul>
        <p>
          Se você não estiver satisfeito com nossa resposta, pode também
          apresentar reclamação à <strong>Autoridade Nacional de Proteção
          de Dados (ANPD)</strong>:
        </p>
        <ul>
          <li>
            Site:{" "}
            <a
              href="https://www.gov.br/anpd"
              target="_blank"
              rel="noreferrer"
            >
              www.gov.br/anpd
            </a>
          </li>
          <li>
            Canal de denúncia oficial:{" "}
            <a
              href="https://www.gov.br/anpd/pt-br/canais_atendimento/cidadao"
              target="_blank"
              rel="noreferrer"
            >
              Canal do cidadão ANPD
            </a>
          </li>
        </ul>
      </>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de privacidade"
      subtitle="Como tratamos seus dados pessoais — o que coletamos, por que, com quem compartilhamos e quais são os seus direitos sob a LGPD."
      lastUpdated="3 de maio de 2026"
      summary={
        <ul>
          <li>
            Coletamos <strong>o mínimo necessário</strong> para operar:
            cadastro, campanhas, doações. Dados financeiros (cartão, CPF, conta
            bancária) ficam com a Stripe — nunca tocamos neles.
          </li>
          <li>
            <strong>Não vendemos</strong> seus dados. Não usamos pra marketing
            de terceiros. Não temos pixel de Facebook, Google Ads ou
            similares.
          </li>
          <li>
            Compartilhamos só com <strong>fornecedores essenciais</strong>{" "}
            (Stripe, Supabase, Vercel, Resend, Sentry) sob contrato de
            processador, e com autoridades quando legalmente obrigados.
          </li>
          <li>
            Você tem todos os <strong>direitos da LGPD</strong>: acessar,
            corrigir, exportar, excluir. Resposta em até 15 dias por email.
          </li>
          <li>
            Encarregado (DPO): Marcelo Caliman ·{" "}
            <a href="mailto:contato@doatividade.com">
              contato@doatividade.com
            </a>
          </li>
        </ul>
      }
      sections={SECTIONS}
    />
  );
}
