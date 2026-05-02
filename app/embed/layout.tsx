/**
 * Layout dedicado pra rotas /embed/* — sem header/footer da plataforma,
 * sem max-width, body transparente. Pra ser embedado em iframe de
 * sites externos.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "transparent",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      {children}
    </div>
  );
}
