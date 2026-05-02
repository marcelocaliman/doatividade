import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = { children: string };

export function Markdown({ children }: Props) {
  return (
    <div className="prose prose-zinc max-w-none text-foreground prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-p:leading-relaxed dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
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
