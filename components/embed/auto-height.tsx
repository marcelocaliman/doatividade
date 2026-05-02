"use client";

import { useEffect } from "react";

/**
 * Quando renderizado dentro de um iframe, observa mudança de altura do
 * documento e dispara postMessage pra o pai ajustar o tamanho do iframe.
 * Sem isso, o iframe fica com altura fixa e corta o conteúdo.
 */
export function AutoHeight() {
  useEffect(() => {
    function send() {
      const h = document.documentElement.scrollHeight;
      window.parent?.postMessage(
        { type: "doatividade:height", height: h },
        "*"
      );
    }

    function onParentRequest(e: MessageEvent) {
      if (e.data?.type === "doatividade:request-height") send();
    }

    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
    window.addEventListener("message", onParentRequest);

    return () => {
      ro.disconnect();
      window.removeEventListener("message", onParentRequest);
    };
  }, []);

  return null;
}
