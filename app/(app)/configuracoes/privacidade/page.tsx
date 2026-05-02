import Link from "next/link";
import { AlertTriangle, Download, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Privacidade — Doatividade" };

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus dados (LGPD)</CardTitle>
          <CardDescription>
            Você tem direito a acessar, exportar, corrigir e excluir seus
            dados a qualquer momento. Mais detalhes na{" "}
            <Link href="/privacidade" className="text-primary underline">
              política de privacidade
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <a
            href="/api/dashboard/donations/csv"
            download
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-fit gap-2"
            )}
          >
            <Download className="h-4 w-4" />
            Baixar histórico de doações (CSV)
          </a>
          <a
            href="mailto:contato@doatividade.com.br?subject=Solicita%C3%A7%C3%A3o%20LGPD"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-fit gap-2"
            )}
          >
            <Mail className="h-4 w-4" />
            Solicitar acesso ou exclusão de dados
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir conta
          </CardTitle>
          <CardDescription>
            Excluir sua conta remove suas campanhas em rascunho e seus dados
            pessoais. Doações já recebidas e seus registros fiscais
            permanecem por 5 anos por exigência legal. Campanhas ativas
            precisam ser encerradas antes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="mailto:contato@doatividade.com.br?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20de%20conta"
            className={cn(
              buttonVariants({ variant: "destructive" }),
              "w-fit gap-2"
            )}
          >
            Solicitar exclusão da conta
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
