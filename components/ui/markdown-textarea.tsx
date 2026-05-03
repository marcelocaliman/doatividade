"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown as MarkdownExt } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  /** Mantido pra compat com chamadas existentes — não usado pelo Tiptap */
  rows?: number;
  /** Mantido pra compat — validação acontece via length checks no submit */
  minLength?: number;
  maxLength?: number;
  className?: string;
};

/* Editor WYSIWYG da descrição da campanha. Tiptap por baixo, mas com
 * persistência em markdown (storage do banco continua markdown puro,
 * zero migração). Toolbar fixa no topo, formatação aplicada inline.
 *
 * Output: hidden input com markdown serializado (`editor.storage.markdown
 * .getMarkdown()`) — FormData captura normalmente. */
export function MarkdownTextarea({
  id,
  name,
  defaultValue = "",
  placeholder,
  required,
  minLength,
  maxLength,
  className,
}: Props) {
  const [markdown, setMarkdown] = useState(String(defaultValue));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer ugc",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder:
          placeholder ??
          "Conte a história da campanha. Use a barra acima pra formatar.",
      }),
      MarkdownExt.configure({
        html: true, // permite <u>
        breaks: true,
        linkify: true,
        transformCopiedText: true,
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => {
      // tiptap-markdown adiciona storage.markdown.getMarkdown() — sem types oficiais
      const storage = editor.storage as unknown as {
        markdown?: { getMarkdown?: () => string };
      };
      const md = storage.markdown?.getMarkdown?.() ?? "";
      setMarkdown(md);
    },
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "tiptap prose prose-zinc max-w-none min-h-[260px] px-4 py-3 focus:outline-none prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-p:leading-relaxed",
      },
    },
  });

  // Sincroniza markdown se defaultValue mudar (raro — form normalmente é mount-only)
  useEffect(() => {
    if (!editor) return;
    if (defaultValue !== markdown && defaultValue !== editor.getHTML()) {
      // Não sobrescreve — defaultValue só inicializa
    }
  }, [editor, defaultValue, markdown]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />

      {/* Hidden input garante que markdown seja serializado no FormData */}
      {name ? (
        <input
          type="hidden"
          name={name}
          value={markdown}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
        />
      ) : null}
    </div>
  );
}

/* ─── Toolbar ─── */

function Toolbar({ editor }: { editor: Editor }) {
  function handleLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      previousUrl ? "Editar URL (vazio remove):" : "URL do link:",
      previousUrl ?? "https://"
    );
    if (url === null) return; // cancelou
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
      <ToolbarButton
        icon={Bold}
        label="Negrito (Cmd/Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Itálico (Cmd/Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Sublinhado (Cmd/Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        divider
      />
      <ToolbarButton
        icon={Link2}
        label="Link (Cmd/Ctrl+K)"
        active={editor.isActive("link")}
        onClick={handleLink}
        divider
      />
      <ToolbarButton
        icon={List}
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label="Citação"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
  divider,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  divider?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      {divider ? (
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      ) : null}
    </>
  );
}
