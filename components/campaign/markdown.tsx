import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

type Props = { children: string };

// Permite tag <u> (sublinhado) que markdown puro não cobre. Tudo que não
// estiver no schema é removido pelo sanitizer — XSS bloqueado.
const SAFE_SCHEMA = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

export function Markdown({ children }: Props) {
  return (
    <div className="prose prose-zinc max-w-none text-foreground prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-p:leading-relaxed dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, SAFE_SCHEMA]]}
        components={{
          a: ({ children, href, ...rest }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer ugc"
              {...rest}
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
