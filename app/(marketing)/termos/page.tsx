import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata = {
  title: "Termos de uso — Doatividade",
};

const SECTIONS: LegalSection[] = [
  {
    id: "definicoes",
    title: "Definições",
    content: (
      <>
        <p>Para clareza, ao longo deste documento:</p>
        <ul>
          <li>
            <strong>&ldquo;Doatividade&rdquo;</strong>, &ldquo;plataforma&rdquo;, &ldquo;nós&rdquo; — refere-se ao serviço
            web disponível em <Link href="/">doatividade.com</Link>, suas APIs,
            bancos de dados e infraestrutura associada.
          </li>
          <li>
            <strong>&ldquo;Usuário&rdquo;</strong> — qualquer pessoa que acessa a
            plataforma, com ou sem conta cadastrada.
          </li>
          <li>
            <strong>&ldquo;Criador&rdquo;</strong> — usuário cadastrado que cria
            campanhas de arrecadação. Pode ser pessoa física (PF) ou pessoa jurídica
            (organização/ONG).
          </li>
          <li>
            <strong>&ldquo;Doador&rdquo;</strong> — pessoa que faz uma doação a uma
            campanha hospedada na plataforma.
          </li>
          <li>
            <strong>&ldquo;Campanha&rdquo;</strong> — projeto de arrecadação criado por
            um Criador, com título, descrição, meta financeira e prazo opcional.
          </li>
          <li>
            <strong>&ldquo;Doação&rdquo;</strong> — transferência de valor feita por um
            Doador a uma Campanha, processada via Stripe.
          </li>
          <li>
            <strong>&ldquo;Stripe&rdquo;</strong> — Stripe, Inc. e suas subsidiárias,
            empresa que processa os pagamentos e mantém a infraestrutura de Connect
            (KYC, payouts, antifraude).
          </li>
          <li>
            <strong>&ldquo;Taxa de serviço&rdquo;</strong> — percentual que a
            Doatividade cobra sobre cada doação processada, conforme tabela em{" "}
            <Link href="/#precos">/#precos</Link>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "natureza",
    title: "Natureza do serviço",
    content: (
      <>
        <p>
          A Doatividade é uma <strong>plataforma de tecnologia</strong> que conecta
          Criadores de campanhas a Doadores. <strong>Não somos</strong>:
        </p>
        <ul>
          <li>instituição financeira, banco ou correspondente bancário;</li>
          <li>processador de pagamentos (essa função é da Stripe);</li>
          <li>fiduciária, custodiante de valores ou escrow;</li>
          <li>responsável pela veracidade ou execução das campanhas;</li>
          <li>parte do contrato entre Criador e Doador.</li>
        </ul>
        <p>
          Atuamos exclusivamente como <strong>intermediária tecnológica</strong>.
          O fluxo financeiro acontece diretamente entre o Doador e o Criador,
          via infraestrutura da Stripe (modelo &ldquo;Direct Charge&rdquo;), e a
          Doatividade nunca tem posse, custódia ou controle dos valores.
        </p>
      </>
    ),
  },
  {
    id: "elegibilidade",
    title: "Elegibilidade e cadastro",
    content: (
      <>
        <p>Para criar uma conta na Doatividade você precisa:</p>
        <ul>
          <li>
            ter <strong>18 anos completos</strong> ou mais, ou ser pessoa
            jurídica devidamente constituída no Brasil (exigência da Stripe e
            da legislação brasileira para abertura de conta de recebimento);
          </li>
          <li>
            possuir CPF (PF) ou CNPJ ativo (PJ), endereço válido no Brasil e
            conta bancária em seu nome ou da pessoa jurídica;
          </li>
          <li>
            fornecer informações <strong>verdadeiras, atuais e completas</strong>{" "}
            durante o cadastro e a abertura da conta Stripe;
          </li>
          <li>
            não estar em listas de sanções (OFAC, ONU, lista nacional brasileira
            de pessoas politicamente expostas em casos restritos), nem ter sido
            previamente banido da plataforma.
          </li>
        </ul>
        <p>
          Você é responsável por <strong>manter suas credenciais</strong> seguras
          (login Google, email/senha) e nos comunicar imediatamente em caso de
          suspeita de acesso não autorizado pelo email{" "}
          <a href="mailto:contato@doatividade.com">contato@doatividade.com</a>.
        </p>
        <p>
          Cada usuário pode ter <strong>uma conta principal</strong>. Contas
          duplicadas, tentativas de burlar suspensão ou usar dados de terceiros
          resultam em encerramento permanente.
        </p>
      </>
    ),
  },
  {
    id: "campanhas",
    title: "Criação e gestão de campanhas",
    content: (
      <>
        <p>Ao criar uma campanha, você (Criador) declara que:</p>
        <ul>
          <li>
            todas as informações descritas (título, descrição, meta, fotos,
            atualizações) são <strong>verdadeiras e não enganosas</strong>;
          </li>
          <li>
            tem <strong>autorização para usar</strong> imagens, vídeos, marcas e
            qualquer outro conteúdo de terceiros (fotos de pessoas exigem
            consentimento; menores exigem autorização dos pais/responsáveis);
          </li>
          <li>
            os valores arrecadados serão usados <strong>conforme prometido</strong>{" "}
            aos doadores. Desvio de finalidade é crime (estelionato, art. 171
            do Código Penal);
          </li>
          <li>
            é <strong>solidariamente responsável</strong> com a campanha caso
            terceiros (familiares, ONGs, cônjuges) sejam beneficiários — ou seja,
            cabe a você prestar contas;
          </li>
          <li>
            assume integralmente o cumprimento de obrigações <strong>fiscais e
            tributárias</strong> sobre os valores recebidos (ver §{" "}
            <a href="#tributos">tributos</a>).
          </li>
        </ul>
        <p>
          Toda nova campanha publicada por conta criada há menos de 30 dias passa
          por <strong>análise manual</strong> de até 24 horas antes de ficar pública.
          Durante a análise, só o Criador vê a página.
        </p>
        <p>
          A Doatividade pode <strong>recusar, pausar, encerrar ou despublicar</strong>{" "}
          qualquer campanha a qualquer momento, sem aviso prévio, se identificar
          violação destes termos, denúncias fundamentadas, suspeita de fraude,
          duplicidade ou descumprimento de exigências legais ou regulatórias.
        </p>
      </>
    ),
  },
  {
    id: "conduta-proibida",
    title: "Conduta e conteúdo proibidos",
    content: (
      <>
        <p>
          É <strong>terminantemente vedado</strong> usar a plataforma para:
        </p>
        <ul>
          <li>
            <strong>Fraude e estelionato</strong> — campanhas falsas, com história
            inventada, com beneficiário fictício, ou que se beneficiem de tragédias
            sem ligação real com o Criador;
          </li>
          <li>
            <strong>Lavagem de dinheiro, financiamento ao terrorismo</strong> ou
            qualquer outra atividade vedada pela Lei 9.613/1998;
          </li>
          <li>
            <strong>Conteúdo ilegal</strong> — relacionado a drogas, armas,
            pornografia, exploração de menores, jogos de azar não autorizados;
          </li>
          <li>
            <strong>Discurso de ódio, discriminação, calúnia, difamação</strong> ou
            ataque a grupos protegidos por lei;
          </li>
          <li>
            <strong>Campanhas político-partidárias</strong> (financiamento de
            partido, candidato ou pré-candidato — vedado pela legislação eleitoral)
            ou que financiem grupos religiosos extremistas;
          </li>
          <li>
            <strong>Violação de propriedade intelectual</strong> (uso não autorizado
            de marcas, fotos, vídeos, músicas);
          </li>
          <li>
            <strong>Spam</strong>, scraping da plataforma, engenharia reversa,
            ataques de DoS, exploração de vulnerabilidades, ou tentativas de
            burlar limites técnicos da plataforma;
          </li>
          <li>
            Criar <strong>contas múltiplas</strong> para burlar suspensões ou
            duplicar campanhas;
          </li>
          <li>
            <strong>Self-donation</strong> ou esquemas de cartão clonado para
            inflar artificialmente o progresso de uma campanha;
          </li>
          <li>
            Fazer <strong>promessas de retorno financeiro</strong> ou de bens em
            troca de doação (configura venda, não doação, e exige outras licenças).
          </li>
        </ul>
        <p>
          Violações resultam em <strong>encerramento da conta</strong>, retenção de
          valores em análise pela Stripe, comunicação às autoridades competentes
          (Polícia Federal, Receita Federal, Ministério Público) quando aplicável,
          e responsabilização civil e criminal do Criador.
        </p>
      </>
    ),
  },
  {
    id: "doacoes",
    title: "Doações, taxas e processamento",
    content: (
      <>
        <p>
          Doações são processadas integralmente pela <strong>Stripe</strong> via
          modelo &ldquo;Direct Charge&rdquo; do Stripe Connect Standard:
        </p>
        <ul>
          <li>
            o valor bruto da doação cai diretamente na conta Stripe do Criador;
          </li>
          <li>
            a taxa da Stripe (~3,99% Pix, ~3,99% + R$ 0,39 cartão; valores
            indicativos, sujeitos à tabela vigente da Stripe) é debitada
            automaticamente;
          </li>
          <li>
            a <strong>taxa de serviço</strong> da Doatividade
            (<Link href="/#precos">consulte tabela atualizada</Link>) é
            transferida automaticamente como <em>application fee</em> à conta
            Stripe da plataforma;
          </li>
          <li>
            o saldo líquido fica disponível ao Criador conforme o cronograma de
            payout da Stripe (geralmente em até 7 dias úteis para conta bancária
            brasileira, sujeito a verificações antifraude).
          </li>
        </ul>
        <p>
          O Doador pode <strong>opcionalmente cobrir</strong> as taxas — quando
          ativa, a doação cobrada ao cartão/Pix é majorada para que o Criador
          receba o valor anunciado. Essa opção fica clara no checkout.
        </p>
        <p>
          A Doatividade pode atualizar a taxa de serviço a qualquer momento; novas
          taxas valem para doações posteriores à comunicação. Doações já
          processadas seguem a taxa vigente no momento da transação.
        </p>
      </>
    ),
  },
  {
    id: "reembolsos",
    title: "Reembolsos, estornos e disputas",
    content: (
      <>
        <p>
          <strong>Doação não é compra</strong>. Não há direito de arrependimento
          previsto no Código de Defesa do Consumidor para doações genuínas, pois
          não há contraprestação. Ainda assim:
        </p>
        <ul>
          <li>
            <strong>Reembolso voluntário</strong>: o Criador pode reembolsar a
            doação manualmente via painel da Stripe se julgar adequado (ex: erro
            de valor, doador arrependido, campanha cancelada).
          </li>
          <li>
            <strong>Chargeback</strong>: se o Doador disputa a doação no banco,
            o estorno é debitado da conta Stripe do Criador, conforme regras do
            Direct Charge. A Doatividade não cobre esse valor. Disputas
            recorrentes (acima de 1% do volume) podem resultar em suspensão da
            conta pela Stripe.
          </li>
          <li>
            <strong>Fraude comprovada</strong>: em casos de fraude por parte do
            Criador (campanha falsa), a Doatividade pode mediar reembolsos
            coordenados com a Stripe e autoridades, e bloquear payouts pendentes.
          </li>
          <li>
            <strong>Cancelamento de Pix por inatividade</strong>: Pix com QR não
            pago em 30 minutos expira automaticamente sem custo.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tributos",
    title: "Tributos e obrigações fiscais",
    content: (
      <>
        <p>
          Cada parte é responsável pelos <strong>seus próprios tributos</strong>:
        </p>
        <ul>
          <li>
            <strong>Criador (PF)</strong>: doações recebidas devem ser informadas
            na Declaração de Imposto de Renda. Doações entre pessoas físicas estão
            sujeitas ao <strong>ITCMD estadual</strong> (varia por UF) quando
            ultrapassam os limites de isenção locais. A Doatividade não retém,
            recolhe nem repassa ITCMD ou IRPF.
          </li>
          <li>
            <strong>Criador (PJ/ONG)</strong>: deve emitir nota/recibo conforme seu
            regime tributário (organizações com imunidade do art. 150 da CF
            mantêm suas próprias regras). A Doatividade não emite recibo fiscal
            em nome do Criador.
          </li>
          <li>
            <strong>Doadores</strong>: responsáveis por declarar suas doações
            quando aplicável (ex: doações dedutíveis a entidades certificadas).
            A Doatividade emite apenas <strong>comprovante de pagamento</strong>{" "}
            (não é recibo fiscal).
          </li>
          <li>
            <strong>Doatividade</strong>: cobra ISS sobre a taxa de serviço
            (intermediação), conforme legislação municipal aplicável.
          </li>
        </ul>
        <p>
          Recomendamos consultar contador caso o volume de arrecadação seja
          significativo. A Doatividade não presta consultoria fiscal e não se
          responsabiliza por interpretações tributárias do Criador.
        </p>
      </>
    ),
  },
  {
    id: "propriedade-intelectual",
    title: "Propriedade intelectual",
    content: (
      <>
        <p>
          O Criador <strong>mantém todos os direitos</strong> sobre o conteúdo da
          sua campanha (texto, fotos, vídeos). Ao publicar, concede à Doatividade
          uma <strong>licença gratuita, não-exclusiva e mundial</strong> para
          armazenar, exibir, distribuir e transmitir esse conteúdo na plataforma e
          em comunicações relacionadas (ex: card de OG no compartilhamento, email
          de notificação a doadores) pelo tempo necessário à operação.
        </p>
        <p>
          A Doatividade pode <strong>destacar</strong> campanhas em sua landing
          page, blog, redes sociais e materiais de marketing institucional, como
          forma de divulgação. O Criador pode opt-out por email caso não deseje.
        </p>
        <p>
          Marcas, logo, código-fonte da plataforma, design e textos institucionais
          da Doatividade são <strong>propriedade exclusiva</strong> da Doatividade
          ou licenciados a ela. Uso não autorizado configura violação de direitos
          autorais e marcários.
        </p>
        <p>
          <strong>Notificação de violação (notice-and-takedown):</strong> se você
          for titular de direitos e identificar conteúdo infringente publicado por
          um Criador, envie notificação fundamentada para{" "}
          <a href="mailto:contato@doatividade.com">contato@doatividade.com</a>{" "}
          com prova de titularidade e indicação da URL infratora. Avaliamos em até
          5 dias úteis.
        </p>
      </>
    ),
  },
  {
    id: "moderacao",
    title: "Moderação, denúncias e investigação",
    content: (
      <>
        <p>
          Qualquer pessoa pode <strong>denunciar</strong> uma campanha pelo botão
          &ldquo;Denunciar&rdquo; presente em todas as páginas públicas. Denúncias
          são anônimas por padrão (email é opcional, usado apenas para retorno).
        </p>
        <p>Em resposta a denúncias, a Doatividade pode:</p>
        <ul>
          <li>
            solicitar <strong>documentação adicional</strong> ao Criador (boletim
            de ocorrência, prontuário médico, comprovantes de uso dos valores);
          </li>
          <li>
            <strong>pausar a campanha</strong> e os payouts da Stripe enquanto
            investiga;
          </li>
          <li>
            <strong>remover a campanha</strong> permanentemente em caso de violação
            confirmada;
          </li>
          <li>
            <strong>colaborar com autoridades</strong> (polícia, MP, Receita
            Federal) mediante requisição formal ou por iniciativa própria quando
            identificar crime grave;
          </li>
          <li>
            preservar <strong>logs e metadados</strong> da campanha por até 5 anos
            para fins de investigação, conforme art. 13-15 do Marco Civil da
            Internet.
          </li>
        </ul>
        <p>
          Decisões de moderação são <strong>discricionárias</strong> da Doatividade
          e não cabem recurso administrativo, sem prejuízo do direito do Criador
          de buscar tutela judicial.
        </p>
      </>
    ),
  },
  {
    id: "limitacao-responsabilidade",
    title: "Limitação de responsabilidade",
    content: (
      <>
        <p>
          A plataforma é fornecida &ldquo;<strong>como está</strong>&rdquo; e
          &ldquo;<strong>conforme disponível</strong>&rdquo;, sem garantias de
          que estará livre de erros, indisponibilidades ou interrupções. Embora
          empreguemos melhor esforço para manter alta disponibilidade, não há
          SLA contratual com usuários gratuitos.
        </p>
        <p>
          <strong>Não nos responsabilizamos por:</strong>
        </p>
        <ul>
          <li>
            insucesso de campanhas em atingir suas metas;
          </li>
          <li>
            <strong>uso indevido</strong> dos valores arrecadados pelo Criador;
          </li>
          <li>
            <strong>conteúdo publicado por usuários</strong>, ainda que veiculado
            via plataforma — nos termos do art. 19 do Marco Civil da Internet,
            só respondemos por conteúdo de terceiros após ordem judicial específica;
          </li>
          <li>
            atos da Stripe, indisponibilidade de pagamento, atrasos de payout
            ou bloqueios decorrentes de regras antifraude da própria Stripe;
          </li>
          <li>
            chargebacks, contestações ou ações judiciais entre Criador e Doador;
          </li>
          <li>
            danos indiretos, lucros cessantes, perda de chance, dano moral
            reflexo, salvo quando expressamente exigido por lei.
          </li>
        </ul>
        <p>
          Em qualquer hipótese de responsabilidade direta da Doatividade, o limite
          máximo de indenização será equivalente ao <strong>total de taxas de
          serviço</strong> efetivamente pagas pelo Criador nos últimos 12 meses,
          ou R$ 1.000,00, o que for maior.
        </p>
      </>
    ),
  },
  {
    id: "indenizacao",
    title: "Indenização",
    content: (
      <>
        <p>
          O Criador concorda em <strong>defender, indenizar e isentar</strong> a
          Doatividade, seus sócios, funcionários e prestadores de serviço de
          quaisquer reclamações, ações judiciais, danos, perdas e despesas
          (incluindo honorários advocatícios) decorrentes de:
        </p>
        <ul>
          <li>
            violação destes termos por parte do Criador;
          </li>
          <li>
            conteúdo de campanha que infrinja direitos de terceiros (autorais,
            marcários, de imagem, honra);
          </li>
          <li>
            uso fraudulento, indevido ou criminoso da plataforma;
          </li>
          <li>
            descumprimento de obrigações fiscais e regulatórias;
          </li>
          <li>
            ações ou omissões que causem dano a doadores ou terceiros.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "encerramento",
    title: "Suspensão e encerramento de conta",
    content: (
      <>
        <p>
          A Doatividade pode, a qualquer tempo e sem aviso prévio:
        </p>
        <ul>
          <li>
            <strong>suspender</strong> uma conta enquanto investiga suspeitas
            (campanhas em andamento ficam pausadas, novos payouts ficam
            retidos pela Stripe);
          </li>
          <li>
            <strong>encerrar</strong> uma conta em caso de violação confirmada,
            inatividade prolongada (mais de 24 meses sem login), ou pedido do
            próprio usuário.
          </li>
        </ul>
        <p>
          Você pode encerrar sua conta a qualquer momento via{" "}
          <Link href="/configuracoes/privacidade">configurações de privacidade</Link>.
          O encerramento:
        </p>
        <ul>
          <li>
            apaga campanhas em rascunho e dados de perfil opcionais (avatar, bio);
          </li>
          <li>
            <strong>preserva</strong> registros de campanhas e doações já
            processadas pelo prazo legal mínimo (5 anos para fins fiscais e de
            compliance);
          </li>
          <li>
            <strong>não devolve</strong> taxas de serviço já cobradas;
          </li>
          <li>
            não afeta a relação direta entre Criador e Doadores quanto a
            obrigações pré-existentes (prestação de contas, cumprimento de promessas).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "forca-maior",
    title: "Força maior",
    content: (
      <p>
        A Doatividade não responde por descumprimento de obrigações causado por
        eventos de força maior ou caso fortuito, incluindo (mas não se limitando
        a): falhas generalizadas de telecomunicações, ataques cibernéticos
        coordenados, indisponibilidades de provedores essenciais (Vercel,
        Supabase, Stripe), decisões judiciais ou regulatórias que impeçam a
        operação, pandemias, calamidades públicas e atos de governo. Nessas
        situações, faremos o melhor esforço para restabelecer o serviço e
        comunicar transparentemente o ocorrido.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações destes termos",
    content: (
      <>
        <p>
          Estes termos podem ser atualizados a qualquer momento. Mudanças
          materiais — que afetem direitos, responsabilidades, taxas ou condições
          essenciais — serão comunicadas com <strong>pelo menos 15 dias de
          antecedência</strong> por email para a conta cadastrada e por aviso
          visível na plataforma.
        </p>
        <p>
          Mudanças menores (ajustes de redação, correção de erro material,
          esclarecimento de cláusula existente) podem entrar em vigor
          imediatamente. O histórico de versões fica disponível mediante
          solicitação por email.
        </p>
        <p>
          O <strong>uso continuado da plataforma após a vigência</strong> de
          novos termos constitui aceitação. Se você não concorda, pode encerrar
          sua conta antes da data de vigência sem qualquer ônus.
        </p>
      </>
    ),
  },
  {
    id: "foro",
    title: "Lei aplicável e foro",
    content: (
      <>
        <p>
          Estes termos são regidos exclusivamente pela <strong>legislação
          brasileira</strong>, em especial pelo Código Civil, Marco Civil da
          Internet (Lei 12.965/2014), Lei Geral de Proteção de Dados (Lei
          13.709/2018), Código de Defesa do Consumidor quando aplicável, e
          legislação fiscal e tributária pertinente.
        </p>
        <p>
          Qualquer controvérsia decorrente destes termos ou do uso da plataforma
          será resolvida no <strong>foro da comarca da sede da Doatividade</strong>{" "}
          (a ser informada via email mediante solicitação), com renúncia expressa
          a qualquer outro, por mais privilegiado que seja.
        </p>
        <p>
          Antes de litígio, comprometemo-nos a tentar <strong>resolução
          amigável</strong> via canal{" "}
          <a href="mailto:contato@doatividade.com">
            contato@doatividade.com
          </a>
          , com resposta em até 10 dias úteis.
        </p>
      </>
    ),
  },
  {
    id: "disposicoes-gerais",
    title: "Disposições gerais",
    content: (
      <>
        <p>
          <strong>Independência das cláusulas:</strong> se qualquer disposição
          destes termos for considerada inválida ou inexequível, as demais
          permanecem em pleno vigor.
        </p>
        <p>
          <strong>Não-renúncia:</strong> a omissão da Doatividade em exercer
          qualquer direito previsto nestes termos não constitui renúncia.
        </p>
        <p>
          <strong>Acordo integral:</strong> estes termos, em conjunto com a{" "}
          <Link href="/privacidade">Política de Privacidade</Link> e com os
          termos da Stripe (
          <a
            href="https://stripe.com/br/legal/connect-account"
            target="_blank"
            rel="noreferrer"
          >
            Stripe Connect Account Agreement
          </a>
          ), constituem o acordo integral entre você e a Doatividade.
        </p>
        <p>
          <strong>Cessão:</strong> você não pode ceder os direitos e obrigações
          destes termos sem consentimento escrito da Doatividade. A Doatividade
          pode ceder em caso de fusão, aquisição, reorganização societária ou
          venda de ativos, mediante notificação aos usuários.
        </p>
        <p>
          <strong>Idioma:</strong> a versão em português brasileiro destes termos
          prevalece sobre eventuais traduções.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    content: (
      <>
        <p>
          Para qualquer assunto relacionado a estes Termos, denúncias, suporte ou
          exercício de direitos:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:contato@doatividade.com">
              contato@doatividade.com
            </a>
          </li>
          <li>
            Para questões de privacidade, consulte também a{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </li>
          <li>
            Tempo médio de resposta: 2 dias úteis (urgências jurídicas: 24h).
          </li>
        </ul>
      </>
    ),
  },
];

export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de uso"
      subtitle="Regras claras para criadores, doadores e visitantes da plataforma. Leia com atenção — usar a Doatividade significa concordar com estes termos."
      lastUpdated="3 de maio de 2026"
      summary={
        <ul>
          <li>
            A Doatividade é uma <strong>plataforma de tecnologia</strong>, não
            instituição financeira. O dinheiro vai direto pra conta Stripe do
            Criador — nunca passa pela gente.
          </li>
          <li>
            <strong>Criadores são responsáveis</strong> pela veracidade da
            campanha, uso correto dos valores e cumprimento das obrigações
            fiscais.
          </li>
          <li>
            <strong>Conteúdo proibido</strong>: fraude, ilegalidade, discurso de
            ódio, partidarismo eleitoral, violação de IP. Tolerância zero.
          </li>
          <li>
            Cobramos uma <strong>taxa de serviço</strong> sobre cada doação
            processada (<Link href="/#precos">tabela vigente aqui</Link>).
            Reembolsos e chargebacks ficam com o Criador.
          </li>
          <li>
            Podemos <strong>suspender ou remover</strong> qualquer campanha que
            viole estes termos, sem aviso prévio.
          </li>
        </ul>
      }
      sections={SECTIONS}
    />
  );
}
