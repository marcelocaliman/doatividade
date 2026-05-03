"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Mail, MessageSquare } from "lucide-react";
import { markDonationMessageRead } from "@/lib/donations/messages";
import { formatBRL, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean | null;
  amount_cents: number;
  message: string;
  created_at: string | null;
  read_at: string | null;
  campaign_id: string;
};

type Props = {
  messages: Message[];
  campaignsById: Map<string, { title: string; slug: string }>;
};

/* Lista compacta tipo tabela. Cada linha mostra avatar + nome + preview
 * curto da mensagem + valor + tempo. Click expande pra ver mensagem
 * inteira e ações (responder, abrir campanha). Mais denso que cards
 * grandes — caber muito mais mensagens visíveis sem scroll. */
export function MessagesList({ messages, campaignsById }: Props) {
  const [items, setItems] = useState(messages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, start] = useTransition();

  function handleToggle(m: Message) {
    setOpenId((prev) => (prev === m.id ? null : m.id));
    if (!m.read_at) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === m.id ? { ...p, read_at: new Date().toISOString() } : p
        )
      );
      start(async () => {
        await markDonationMessageRead({ id: m.id });
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
        <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/40" />
        <p className="mt-4 text-base font-medium">Nenhuma mensagem</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Doadores podem deixar mensagens no checkout. Quando alguém escrever,
          aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <ul className="divide-y">
        {items.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            campaign={campaignsById.get(m.campaign_id)}
            isOpen={openId === m.id}
            onToggle={() => handleToggle(m)}
          />
        ))}
      </ul>
    </div>
  );
}

function MessageRow({
  message: m,
  campaign,
  isOpen,
  onToggle,
}: {
  message: Message;
  campaign?: { title: string; slug: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isUnread = !m.read_at;
  const displayName = m.is_anonymous
    ? "Anônimo"
    : (m.donor_name ?? m.donor_email ?? "—");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <li
      className={cn(
        "transition-colors",
        isUnread ? "bg-primary/[0.025]" : "bg-card"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
      >
        {/* Indicador unread */}
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 flex-none rounded-full",
            isUnread ? "bg-primary" : "bg-transparent"
          )}
        />
        {/* Avatar inicial */}
        <span
          className={cn(
            "flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold",
            isUnread
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {initial}
        </span>
        {/* Nome + preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "truncate text-sm",
                isUnread ? "font-bold" : "font-medium"
              )}
            >
              {displayName}
            </p>
            {campaign ? (
              <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
                · {campaign.title}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[13px]",
              isUnread ? "text-foreground/85" : "text-muted-foreground"
            )}
          >
            {m.message}
          </p>
        </div>
        {/* Valor + tempo */}
        <div className="flex flex-none flex-col items-end gap-0.5">
          <span className="text-sm font-bold tabular-nums text-primary">
            {formatBRL(m.amount_cents)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatRelative(m.created_at)}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 flex-none text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Expansão: mensagem inteira + ações */}
      {isOpen ? (
        <div className="border-t bg-muted/20 px-4 py-4 sm:px-16">
          <blockquote className="text-sm leading-relaxed text-foreground/90">
            &ldquo;{m.message}&rdquo;
          </blockquote>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {campaign ? (
              <Link
                href={`/c/${campaign.slug}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 hover:bg-card/80 hover:text-foreground"
              >
                {campaign.title}
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            ) : null}
            {!m.is_anonymous && m.donor_email ? (
              <a
                href={`mailto:${m.donor_email}?subject=Obrigado pela doação!`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 font-medium text-primary hover:bg-primary/10"
              >
                <Mail className="h-2.5 w-2.5" />
                Responder por email
              </a>
            ) : null}
            {!m.is_anonymous && m.donor_email ? (
              <span className="text-muted-foreground/80">
                {m.donor_email}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
