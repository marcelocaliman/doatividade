"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, Mail, MessageSquare, Quote } from "lucide-react";
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

export function MessagesList({ messages, campaignsById }: Props) {
  const [items, setItems] = useState(messages);
  const [, start] = useTransition();

  function handleMarkRead(m: Message) {
    if (m.read_at) return;
    setItems((prev) =>
      prev.map((p) =>
        p.id === m.id ? { ...p, read_at: new Date().toISOString() } : p
      )
    );
    start(async () => {
      await markDonationMessageRead({ id: m.id });
    });
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
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((m) => (
        <MessageCard
          key={m.id}
          message={m}
          campaign={campaignsById.get(m.campaign_id)}
          onMarkRead={() => handleMarkRead(m)}
        />
      ))}
    </ul>
  );
}

function MessageCard({
  message: m,
  campaign,
  onMarkRead,
}: {
  message: Message;
  campaign?: { title: string; slug: string };
  onMarkRead: () => void;
}) {
  const isUnread = !m.read_at;
  const displayName = m.is_anonymous
    ? "Anônimo"
    : (m.donor_name ?? m.donor_email ?? "—");

  return (
    <li
      onClick={onMarkRead}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md",
        isUnread
          ? "border-primary/30 bg-primary/[0.02]"
          : "border-border bg-card"
      )}
    >
      {isUnread ? (
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"
        />
      ) : null}

      <header className="flex items-start justify-between gap-3 pr-4">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-bold" : "font-semibold"
            )}
          >
            {displayName}
          </p>
          {!m.is_anonymous && m.donor_email ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {m.donor_email}
            </p>
          ) : null}
        </div>
        <span className="flex-none text-base font-bold tabular-nums text-primary">
          {formatBRL(m.amount_cents)}
        </span>
      </header>

      <blockquote className="relative rounded-lg bg-muted/40 p-3 pl-6 text-sm leading-relaxed">
        <Quote className="absolute left-2 top-2 h-3 w-3 text-muted-foreground/40" />
        {m.message}
      </blockquote>

      <footer className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {campaign ? (
            <Link
              href={`/c/${campaign.slug}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
            >
              {campaign.title}
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          ) : (
            "—"
          )}
          {" · "}
          {formatRelative(m.created_at)}
        </span>
        {!m.is_anonymous && m.donor_email ? (
          <a
            href={`mailto:${m.donor_email}?subject=Obrigado pela doação!`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[10px] font-medium text-primary hover:underline"
          >
            <Mail className="h-2.5 w-2.5" />
            Responder
          </a>
        ) : null}
      </footer>
    </li>
  );
}
