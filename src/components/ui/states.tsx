import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("grid min-h-64 place-items-center p-8 text-center", className)}>
      <div className="max-w-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Inbox className="size-5" /></span>
        <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Bilgiler yüklenemedi",
  description = "Kısa bir süre sonra yeniden deneyin.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertCircle className="size-5" /></span>
        <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Yeniden dene</Button>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}
