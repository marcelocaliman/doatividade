type Props = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {lastUpdated}
        </p>
      </header>
      <div className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-headings:text-foreground prose-h2:mt-8 prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-lg prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-li:my-1">
        {children}
      </div>
    </article>
  );
}
