import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton da página da campanha — preserva o layout (banner + 2 colunas)
 * pra evitar layout shift quando o conteúdo carrega.
 */
export default function CampaignLoading() {
  return (
    <div className="flex flex-col">
      {/* Banner */}
      <Skeleton className="h-[260px] w-full sm:h-[340px] lg:h-[400px]" />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
        <div className="lg:grid lg:items-start lg:gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="flex flex-col gap-6">
            {/* ProgressCard */}
            <Skeleton className="h-44 w-full rounded-2xl" />

            {/* Sobre + galeria */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-9/12" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden flex-col gap-5 lg:flex">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[480px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
