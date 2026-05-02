import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton genérico pra qualquer rota dentro do (app). Mantém o layout
 * (sidebar/topbar do AppLayout) e mostra uma área principal "carregando".
 */
export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-2/3 max-w-md" />
      <Skeleton className="mt-2 h-5 w-1/2 max-w-sm" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Skeleton className="h-32 w-full md:col-span-2" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
