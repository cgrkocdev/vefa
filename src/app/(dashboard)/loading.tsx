import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1480px]" aria-label="Sayfa yükleniyor">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-72 max-w-full" />
      <Skeleton className="mt-2 h-4 w-56 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5"><Skeleton className="size-12" /><Skeleton className="mt-5 h-5 w-28" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-2/3" /></Card>
        ))}
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Card key={index} className="flex items-center gap-4 p-5"><Skeleton className="size-11 shrink-0" /><div className="flex-1"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-6 w-32" /></div></Card>)}
      </div>
      <Card className="mt-7 p-6"><Skeleton className="h-5 w-40" />{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="mt-5 h-12 w-full" />)}</Card>
    </div>
  );
}
