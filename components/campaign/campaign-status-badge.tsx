import { Badge } from "@/components/ui/badge";

type Props = { status: string };

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "outline"
      | "destructive"
      | "success"
      | "warning"
      | "info";
  }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_review: { label: "Em revisão", variant: "warning" },
  active: { label: "Ativa", variant: "success" },
  paused: { label: "Pausada", variant: "warning" },
  completed: { label: "Concluída", variant: "info" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export function CampaignStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
