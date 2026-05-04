export type AdminSeverity = "info" | "success" | "warning" | "critical";

/* Tipos conhecidos pra UI montar label/ícone. Schema não tem check
 * constraint pra evitar acoplamento — backend pode emitir tipos novos
 * sem migration. UI faz fallback pro próprio `type` se faltar mapping. */
export const ADMIN_NOTIFICATION_TYPES = {
  user_signed_up: "Novo usuário",
  user_first_donation: "Primeira doação enviada",
  campaign_pending_review: "Aguardando revisão",
  campaign_published: "Campanha publicada",
  campaign_paused: "Campanha pausada",
  campaign_suspended: "Campanha suspensa",
  campaign_completed: "Campanha encerrada",
  donation_succeeded: "Doação concluída",
  donation_failed: "Doação falhou",
  donation_refunded: "Doação reembolsada",
  donation_disputed: "Chargeback aberto",
  subscription_started: "Nova assinatura",
  subscription_canceled: "Assinatura cancelada",
  subscription_past_due: "Pagamento atrasado",
  report_received: "Nova denúncia",
  report_action_taken: "Denúncia: ação tomada",
  payout_paid: "Saque enviado",
  payout_failed: "Saque falhou",
  connect_capability_changed: "Capability Stripe mudou",
  connect_deauthorized: "Conta Connect desautorizada",
  connect_kyc_completed: "KYC concluído",
  webhook_failure: "Falha em webhook",
  cron_failure: "Falha em cron",
  email_bounce: "Email bounced",
  pix_availability_changed: "Pix disponibilidade mudou",
  system: "Sistema",
} as const;

export type AdminNotificationType = keyof typeof ADMIN_NOTIFICATION_TYPES;

export type AdminNotification = {
  id: string;
  type: string;
  severity: AdminSeverity;
  title: string;
  body: string | null;
  href: string | null;
  campaign_id: string | null;
  donation_id: string | null;
  subscription_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
