import { Badge } from "@/components/ui/badge";

type Props = { status: string };

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em revisão", variant: "outline" },
  active: { label: "Ativa", variant: "default" },
  paused: { label: "Pausada", variant: "outline" },
  completed: { label: "Concluída", variant: "secondary" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export function CampaignStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
