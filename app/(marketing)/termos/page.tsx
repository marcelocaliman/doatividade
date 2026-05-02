import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Termos de uso — Doatividade",
};

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso" lastUpdated="2 de maio de 2026">
      <p>
        A <strong>Doatividade</strong> é uma plataforma de tecnologia que
        conecta criadores de campanhas de arrecadação a doadores. Não somos
        instituição financeira nem responsáveis pelo conteúdo das campanhas.
      </p>

      <p>Ao usar a plataforma, você concorda com os termos abaixo.</p>

      <h2>1. Sobre as campanhas</h2>
      <ul>
        <li>
          Você é responsável pela <strong>veracidade das informações</strong>{" "}
          da sua campanha.
        </li>
        <li>
          A Doatividade pode <strong>remover campanhas</strong> que violem
          estes termos sem aviso prévio.
        </li>
        <li>
          Conteúdo proibido: fraudulento, enganoso, ilegal,
          político-partidário, religioso extremista, que incite ódio ou viole
          direitos de terceiros.
        </li>
        <li>
          Você é responsável pelo <strong>uso correto dos valores</strong>{" "}
          arrecadados, conforme o que foi prometido aos doadores.
        </li>
      </ul>

      <h2>2. Sobre as doações</h2>
      <ul>
        <li>
          Doações são processadas pela <strong>Stripe</strong> diretamente
          para a conta do criador (Direct Charge). A Doatividade nunca toca no
          dinheiro.
        </li>
        <li>
          A Doatividade cobra uma taxa de serviço sobre cada doação processada
          (ver <Link href="/#precos">Preços</Link>).
        </li>
        <li>
          Doadores podem optar por cobrir as taxas — quando ativo, o criador
          recebe o valor integral e o doador paga a diferença.
        </li>
        <li>
          Reembolsos são responsabilidade do criador da campanha. A Doatividade
          pode mediar em casos de fraude comprovada.
        </li>
      </ul>

      <h2>3. Sobre fraude, denúncias e moderação</h2>
      <ul>
        <li>
          Suspeita de fraude ou conteúdo inadequado pode ser denunciada via
          botão &quot;Denunciar&quot; no rodapé de qualquer página de campanha.
          A denúncia é anônima por padrão (você pode opcionalmente informar
          email pra contato).
        </li>
        <li>
          Toda campanha publicada por conta nova passa por análise manual de
          até 24 horas antes de ficar pública. Durante esse período só o
          criador vê a página.
        </li>
        <li>
          A Doatividade pode <strong>pausar, despublicar ou rejeitar</strong>{" "}
          campanhas a qualquer momento se identificar violação destes termos
          ou se receber denúncias fundamentadas.
        </li>
        <li>
          <strong>Chargebacks</strong> (estornos solicitados pelo doador no
          banco) são de responsabilidade do criador, conforme o modelo Direct
          Charge da Stripe.
        </li>
        <li>
          A Doatividade colabora com autoridades em casos comprovados de
          fraude e mantém registros de operações conforme a lei.
        </li>
      </ul>

      <h2>4. Sobre limitações de responsabilidade</h2>
      <ul>
        <li>
          A Doatividade <strong>não garante</strong> que campanhas atinjam
          suas metas.
        </li>
        <li>
          Não somos responsáveis pelo uso indevido de valores pelos criadores.
        </li>
        <li>
          Indisponibilidades técnicas serão comunicadas e resolvidas com
          melhor esforço, sem direito a indenização.
        </li>
        <li>
          Não somos parte do contrato entre criador e doador. Disputas devem
          ser resolvidas diretamente entre as partes.
        </li>
      </ul>

      <h2>5. Sobre conta e acesso</h2>
      <ul>
        <li>
          Idade mínima: <strong>18 anos</strong> (conforme exigência da
          Stripe).
        </li>
        <li>
          Você é responsável por manter as credenciais de acesso (login com
          Google) seguras.
        </li>
        <li>
          A Doatividade pode suspender ou encerrar contas que violem estes
          termos.
        </li>
      </ul>

      <h2>6. Sobre alterações</h2>
      <ul>
        <li>
          Podemos atualizar estes termos. Mudanças significativas serão
          comunicadas por email ou aviso na plataforma com pelo menos 15 dias
          de antecedência.
        </li>
        <li>
          O uso continuado da plataforma após a atualização indica aceitação
          dos novos termos.
        </li>
      </ul>

      <h2>7. Foro e legislação</h2>
      <p>
        Estes termos são regidos pela legislação brasileira. Fica eleito o
        foro da comarca da sede da Doatividade para dirimir quaisquer
        controvérsias, com renúncia a qualquer outro por mais privilegiado
        que seja.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas ou denúncias:{" "}
        <a href="mailto:contato@doatividade.com.br">
          contato@doatividade.com.br
        </a>
        .
      </p>
    </LegalPage>
  );
}
