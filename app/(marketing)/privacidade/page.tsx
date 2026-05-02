import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Privacidade — Doatividade",
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      lastUpdated="2 de maio de 2026"
    >
      <p>
        A <strong>Doatividade</strong> respeita sua privacidade e cumpre a Lei
        Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Esta política
        explica quais dados coletamos, como usamos e quais são seus direitos.
      </p>

      <h2>1. Dados que coletamos</h2>

      <h3>Criador de campanha</h3>
      <ul>
        <li>Nome completo, email e foto de perfil (via Google OAuth).</li>
        <li>
          CPF ou CNPJ, endereço, dados bancários — coletados e armazenados
          pela Stripe, não pela Doatividade.
        </li>
        <li>Informações da campanha que você publicar.</li>
      </ul>

      <h3>Doador</h3>
      <ul>
        <li>Nome (ou &quot;Anônimo&quot; se optar), email e mensagem.</li>
        <li>
          Dados de pagamento (cartão, Pix) processados exclusivamente pela
          Stripe. Doatividade não armazena dados de cartão.
        </li>
      </ul>

      <h3>Dados técnicos</h3>
      <ul>
        <li>
          IP, navegador, sistema operacional, páginas visitadas — coletados
          de forma agregada via Vercel Analytics, sem identificação pessoal.
        </li>
      </ul>

      <h2>2. Como usamos seus dados</h2>
      <ul>
        <li>Operar a plataforma (autenticação, processamento de doações).</li>
        <li>
          Comunicar sobre suas campanhas e doações (recibos, atualizações).
        </li>
        <li>Cumprir obrigações legais e regulatórias.</li>
        <li>Prevenir fraude e violações dos Termos de Uso.</li>
      </ul>
      <p>
        <strong>Não usamos seus dados pra marketing de terceiros</strong> nem
        vendemos pra ninguém.
      </p>

      <h2>3. Compartilhamento</h2>
      <p>
        Compartilhamos dados apenas com fornecedores essenciais à operação:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> (processamento de pagamento, KYC) — sediada
          nos EUA, com cláusulas contratuais aprovadas pela ANPD.
        </li>
        <li>
          <strong>Supabase</strong> (banco de dados e autenticação) — com
          medidas técnicas adequadas de proteção.
        </li>
        <li>
          <strong>Resend</strong> (envio de emails transacionais) — somente
          email + nome.
        </li>
        <li>
          <strong>Autoridades competentes</strong>, quando legalmente exigido
          (ordem judicial, investigação policial, etc).
        </li>
      </ul>

      <h2>4. Seus direitos (LGPD)</h2>
      <p>Conforme a LGPD, você pode a qualquer momento:</p>
      <ul>
        <li>Acessar todos os dados pessoais que mantemos sobre você.</li>
        <li>Corrigir dados incorretos ou desatualizados.</li>
        <li>Solicitar exclusão dos seus dados (exceto os exigidos por lei).</li>
        <li>Solicitar exportação dos seus dados em formato estruturado.</li>
        <li>Revogar consentimento dado anteriormente.</li>
        <li>
          Opor-se ao tratamento que considere inadequado ou desnecessário.
        </li>
      </ul>
      <p>
        Pra exercer qualquer desses direitos, mande email pra{" "}
        <a href="mailto:contato@doatividade.com.br">
          contato@doatividade.com.br
        </a>
        . Respondemos em até 15 dias úteis.
      </p>

      <h2>5. Retenção</h2>
      <ul>
        <li>
          Dados de campanhas e doações ficam armazenados pelo período exigido
          por lei (mínimo 5 anos pra fins fiscais).
        </li>
        <li>
          Dados de conta podem ser excluídos a pedido, exceto registros
          mínimos exigidos para compliance financeiro.
        </li>
      </ul>

      <h2>6. Cookies</h2>
      <ul>
        <li>
          Usamos cookies <strong>essenciais</strong> pra autenticação e
          funcionamento da plataforma.
        </li>
        <li>
          <strong>Não usamos</strong> cookies de marketing ou tracking de
          terceiros (Google Ads, Facebook Pixel, etc).
        </li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Aplicamos medidas técnicas e organizacionais razoáveis pra proteger
        seus dados: HTTPS em toda comunicação, criptografia em repouso,
        controle de acesso, logs de auditoria. Em caso de incidente que afete
        seus dados, comunicaremos a ANPD e os titulares conforme a LGPD.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Esta política pode ser atualizada. Mudanças relevantes serão
        comunicadas com ao menos 15 dias de antecedência via email ou aviso
        na plataforma.
      </p>

      <h2>Encarregado de dados (DPO)</h2>
      <p>
        Marcelo Caliman — encarregado pelo tratamento de dados pessoais
        conforme o art. 41 da LGPD. Contato:{" "}
        <a href="mailto:contato@doatividade.com.br">
          contato@doatividade.com.br
        </a>
        .
      </p>
    </LegalPage>
  );
}
