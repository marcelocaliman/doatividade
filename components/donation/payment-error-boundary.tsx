"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  /** Disparado quando o usuário clica em "Voltar" depois do erro. */
  onReset: () => void;
};

type State = { hasError: boolean; error: Error | null };

/**
 * Captura erros renderizados na árvore do PaymentElement (loadStripe falha,
 * Elements provider crash, problema de rede, etc) pra não propagar pro
 * error.tsx global do app — que faria o usuário sair da página da campanha.
 */
export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[PaymentErrorBoundary] caught", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-destructive">
                Falha ao carregar o pagamento
              </p>
              <p className="text-xs text-destructive/80">
                {this.state.error?.message ?? "Erro inesperado no Stripe."}{" "}
                Volte e tente de novo. Se persistir, recarregue a página.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={this.reset}
            className="self-start"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Voltar e tentar de novo
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
