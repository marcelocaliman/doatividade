// Service worker "kill switch" — substituiu qualquer SW antigo registrado em
// localhost:3000 (de outro projeto, dev session anterior, etc) por uma versão
// que se desregistra sozinha e força reload das tabs abertas.
//
// O navegador re-busca /sw.js sempre que tenta atualizar o SW. Quando recebe
// este conteúdo, instala (skipWaiting), ativa, unregister + reload das clients,
// e sai de cena. Depois disso o browser não tem SW algum e os chunks do
// Turbopack/Next param de ser servidos da cache vencida.

export const dynamic = "force-static";

const SW_BODY = `
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    } catch (err) {
      console.warn('[sw kill switch] cleanup failed', err);
    }
  })());
});
self.addEventListener('fetch', () => {
  /* deliberadamente sem handlers — o SW vai morrer em segundos */
});
`;

export function GET() {
  return new Response(SW_BODY, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
