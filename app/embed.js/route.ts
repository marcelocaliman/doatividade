/**
 * Script de embed pra colocar uma campanha em qualquer site:
 *
 *   <div data-doatividade-embed="ajude-o-toby"></div>
 *   <script src="https://doatividade.com.br/embed.js" defer></script>
 *
 * O script encontra todos os divs com data-doatividade-embed e troca
 * por um iframe apontando pra /embed/[slug]. Usa postMessage pra
 * autoajustar a altura conforme o conteúdo carrega.
 */

export const dynamic = "force-static";

const SCRIPT = `(function(){
  var origin = "__ORIGIN__";
  function mount(el){
    var slug = el.getAttribute("data-doatividade-embed");
    if (!slug || el.dataset.doatividadeMounted === "1") return;
    el.dataset.doatividadeMounted = "1";

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(slug);
    iframe.title = "Campanha Doatividade";
    iframe.loading = "lazy";
    iframe.style.cssText = "border:0;width:100%;max-width:380px;display:block;background:transparent;";
    iframe.allow = "payment";
    iframe.height = "260";
    el.appendChild(iframe);

    function resize(h){
      iframe.style.height = (h + 4) + "px";
    }

    window.addEventListener("message", function(e){
      if (e.source !== iframe.contentWindow) return;
      if (e.data && e.data.type === "doatividade:height") {
        resize(e.data.height);
      }
    });

    iframe.addEventListener("load", function(){
      try {
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: "doatividade:request-height" }, "*");
      } catch (_) {}
    });
  }

  function scan(){
    var els = document.querySelectorAll("[data-doatividade-embed]");
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  // Re-scan se SPA externa adicionar nodes depois
  var mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();`;

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const body = SCRIPT.replace("__ORIGIN__", origin);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
