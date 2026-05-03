"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Underline,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/campaign/markdown";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<typeof Textarea>;

type Props = Omit<TextareaProps, "value"> & {
  defaultValue?: string;
};

/* Textarea com toolbar markdown leve. Sem dependência WYSIWYG —
 * insere `**bold**`, `[texto](url)`, `<u>under</u>` etc na posição
 * do cursor. Toggle Editar/Visualizar usa o Markdown component oficial
 * pra preview real do que vai aparecer na campanha.
 *
 * Mantém compatibilidade com forms HTML — `name` é passado pra Textarea,
 * FormData captura o valor normalmente. */
export function MarkdownTextarea({
  defaultValue = "",
  className,
  onChange,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(String(defaultValue));
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function applyWrap(prefix: string, suffix = prefix, placeholder = "texto") {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || placeholder;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const next = before + prefix + selected + suffix + after;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function applyLine(prefix: string, placeholder = "texto") {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
    const before = textarea.value.slice(0, lineStart);
    const rest = textarea.value.slice(lineStart);
    // Se a linha já começa com o prefix, remove (toggle)
    let next: string;
    let cursorOffset: number;
    if (rest.startsWith(prefix)) {
      next = before + rest.slice(prefix.length);
      cursorOffset = -prefix.length;
    } else {
      // Se a linha está vazia, usa placeholder
      const lineEnd = rest.indexOf("\n");
      const currentLine = lineEnd === -1 ? rest : rest.slice(0, lineEnd);
      const insert = currentLine.length === 0 ? prefix + placeholder : prefix;
      next = before + insert + rest;
      cursorOffset = insert.length;
    }
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    });
  }

  function applyLink() {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || "texto";
    const url = window.prompt("URL do link:", "https://");
    if (!url) return;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const insert = `[${selected}](${url})`;
    const next = before + insert + after;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + insert.length,
        start + insert.length
      );
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      applyWrap("**", "**", "negrito");
    } else if (e.key === "i" || e.key === "I") {
      e.preventDefault();
      applyWrap("*", "*", "itálico");
    } else if (e.key === "k" || e.key === "K") {
      e.preventDefault();
      applyLink();
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex items-center justify-between gap-1 border-b bg-muted/30 px-1.5 py-1">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarButton
            icon={Bold}
            label="Negrito (Cmd/Ctrl+B)"
            onClick={() => applyWrap("**", "**", "negrito")}
            disabled={mode === "preview"}
          />
          <ToolbarButton
            icon={Italic}
            label="Itálico (Cmd/Ctrl+I)"
            onClick={() => applyWrap("*", "*", "itálico")}
            disabled={mode === "preview"}
          />
          <ToolbarButton
            icon={Underline}
            label="Sublinhado"
            onClick={() => applyWrap("<u>", "</u>", "sublinhado")}
            disabled={mode === "preview"}
            divider
          />
          <ToolbarButton
            icon={Link2}
            label="Link (Cmd/Ctrl+K)"
            onClick={applyLink}
            disabled={mode === "preview"}
            divider
          />
          <ToolbarButton
            icon={List}
            label="Lista"
            onClick={() => applyLine("- ", "item")}
            disabled={mode === "preview"}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Lista numerada"
            onClick={() => applyLine("1. ", "item")}
            disabled={mode === "preview"}
          />
          <ToolbarButton
            icon={Quote}
            label="Citação"
            onClick={() => applyLine("> ", "citação")}
            disabled={mode === "preview"}
          />
        </div>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "edit" ? "preview" : "edit"))}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
            mode === "preview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {mode === "preview" ? (
            <>
              <Pencil className="h-3 w-3" />
              Editar
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Visualizar
            </>
          )}
        </button>
      </div>

      {mode === "preview" ? (
        <div className="min-h-[240px] px-4 py-3">
          {value.trim().length > 0 ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Sem conteúdo pra visualizar.
            </p>
          )}
        </div>
      ) : (
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
            className
          )}
          {...rest}
        />
      )}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  divider,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      {divider ? (
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      ) : null}
    </>
  );
}
