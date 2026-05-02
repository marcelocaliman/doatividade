"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCampaignUpdate,
  deleteCampaignUpdate,
} from "@/lib/campaign-updates/actions";
import { formatRelative } from "@/lib/utils/format";

type Item = {
  id: string;
  title: string | null;
  content: string;
  created_at: string | null;
};

type Props = {
  campaignId: string;
  initialItems: Item[];
};

export function UpdatesManager({ campaignId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 10) {
      setError("Mensagem precisa ter pelo menos 10 caracteres.");
      return;
    }
    startTransition(async () => {
      const result = await createCampaignUpdate({
        campaign_id: campaignId,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setItems((prev) => [
        {
          id: result.data.id,
          title: title.trim() || null,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setContent("");
      toast.success("Atualização publicada. Doadores serão notificados por email.");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Excluir esta atualização?")) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCampaignUpdate({ id });
      setDeletingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removida.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="upd_title">
            Título <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="upd_title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Ex: Cirurgia marcada!"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="upd_content">Mensagem</Label>
          <Textarea
            id="upd_content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            placeholder="Conta a novidade pros doadores. Eles vão receber por email."
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Publicando…" : "Publicar atualização"}
          </Button>
        </div>
      </form>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((u) => (
            <li
              key={u.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {u.title ? (
                    <p className="font-medium">{u.title}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(u.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {u.content}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Nenhuma atualização ainda.
        </p>
      )}
    </div>
  );
}
