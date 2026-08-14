import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/api";

export const statusLabel: Record<PresenceStatus, string> = {
  online: "Online",
  working: "Working",
  meeting: "In meeting",
  away: "Away",
  offline: "Offline",
};

export const statusTone: Record<PresenceStatus, string> = {
  online: "bg-success",
  working: "bg-primary",
  meeting: "bg-warning",
  away: "bg-muted-foreground",
  offline: "bg-border",
};

export function StatusPill({ status }: { status: PresenceStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.1em] text-muted-foreground uppercase">
      <span className={cn("size-1.5 rounded-full", statusTone[status])} />
      {statusLabel[status]}
    </span>
  );
}

/** Purely decorative desk furniture: triple monitors, RGB strip and a plant. */
export function DeskFurniture({ monitors = 3, glow }: { monitors?: number; glow?: boolean }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-1.5">
      <div className="flex items-end gap-1">
        {Array.from({ length: monitors }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "rounded-[3px] border border-border/80 bg-background/70",
              index === 1 ? "h-5 w-8" : "h-4 w-6",
              glow && "shadow-[0_0_10px_oklch(0.78_0.145_205_/_45%)]",
            )}
          />
        ))}
      </div>
      <span className="rgb-strip h-[3px] w-16 rounded-full opacity-80" />
    </div>
  );
}

export function Plant({ className }: { className?: string }) {
  return (
    <span className={cn("pointer-events-none flex flex-col items-center", className)} aria-hidden>
      <span className="text-lg leading-none">🪴</span>
      <span className="mt-0.5 h-1 w-5 rounded-full bg-border" />
    </span>
  );
}

export function ZoneLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
      {icon}
      {children}
    </p>
  );
}
