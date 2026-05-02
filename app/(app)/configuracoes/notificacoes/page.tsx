import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, BellOff, Check } from "lucide-react";

export const metadata = { title: "Notificações — Doatividade" };

const NOTIFICATIONS = [
  {
    title: "Doação recebida",
    description: "Email pra você quando alguém doar (em breve)",
    enabled: false,
    soon: true,
  },
  {
    title: "Saque concluído",
    description: "Email quando o Stripe enviar dinheiro pra sua conta bancária",
    enabled: true,
  },
  {
    title: "Saque falhou",
    description: "Email se algo der errado com o saque automático",
    enabled: true,
  },
  {
    title: "Reembolso processado",
    description: "Email quando uma doação é reembolsada",
    enabled: true,
  },
  {
    title: "Campanha publicada",
    description: "Email com dicas de divulgação após publicar",
    enabled: true,
  },
  {
    title: "Atualização da campanha (doadores)",
    description:
      "Doadores não-anônimos recebem email quando você publica nova atualização",
    enabled: true,
  },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Notificações por email</CardTitle>
          <CardDescription>
            O que você e seus doadores recebem por email. Personalização
            individual chega em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {NOTIFICATIONS.map((n) => (
              <li
                key={n.title}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {n.enabled ? (
                    <Bell className="mt-0.5 h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.description}
                    </p>
                  </div>
                </div>
                {n.soon ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    em breve
                  </span>
                ) : n.enabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    ativo
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
