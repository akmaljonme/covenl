import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function LoadingRow({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {message ?? "Something went wrong while loading this data."}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <EmptyState
      title={`${feature} — coming soon`}
      description={`${feature} is not part of the COVENL MVP yet. It is intentionally disabled instead of faked.`}
    />
  );
}
