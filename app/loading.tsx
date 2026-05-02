import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/2" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
