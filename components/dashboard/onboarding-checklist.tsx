import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

type Props = {
  steps: Step[];
};

export function OnboardingChecklist({ steps }: Props) {
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (doneCount === total) return null;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/[0.04] to-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Configure sua conta
          </h2>
          <p className="text-sm text-muted-foreground">
            {doneCount} de {total} etapas concluídas · {pct}%
          </p>
        </div>
        <div className="hidden sm:block">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-4 transition-all",
                step.done
                  ? "border-transparent bg-muted/40"
                  : "bg-card hover:border-primary/30 hover:shadow-sm"
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
              ) : (
                <Circle className="h-5 w-5 flex-none text-muted-foreground/40" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
              {!step.done ? (
                <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:inline-flex">
                  {step.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
