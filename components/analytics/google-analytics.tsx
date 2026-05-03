import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-EEWN6WEFMG";

/**
 * Google Analytics gtag.js. Carrega só em produção pra não poluir o GA
 * com tráfego de dev/preview. `afterInteractive` garante que não bloqueia
 * a primeira pintura — script entra após hidratação.
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}
