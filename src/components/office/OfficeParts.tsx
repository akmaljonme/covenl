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

export function StatusPill({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.1em] text-muted-foreground uppercase",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            statusTone[status],
            status === "offline" && "hidden",
          )}
        />
        <span className={cn("relative inline-flex size-1.5 rounded-full", statusTone[status])} />
      </span>
      {statusLabel[status]}
    </span>
  );
}

/** Floating dark nameplate hovering above a desk pod — matches the HQ render. */
export function NamePlate({
  name,
  role,
  status,
  className,
}: {
  name: string;
  role?: string | null;
  status?: PresenceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-[oklch(0.12_0.03_265/88%)] px-2.5 py-1 shadow-[0_8px_20px_-10px_oklch(0_0_0/80%)] backdrop-blur-sm",
        className,
      )}
    >
      {status ? (
        <span className={cn("size-1.5 shrink-0 rounded-full", statusTone[status])} />
      ) : null}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[0.68rem] font-semibold text-white">{name}</span>
        {role ? <span className="truncate text-[0.58rem] text-white/55">{role}</span> : null}
      </span>
    </span>
  );
}

type DeskVariant = "director" | "human" | "ai";

const deskGlow: Record<DeskVariant, string> = {
  director: "text-primary",
  human: "text-primary",
  ai: "text-secondary",
};

/**
 * Isometric desk illustration: tabletop, standing monitor(s), keyboard, chair and cable glow.
 * Purely decorative — driven entirely by props sourced from real desk/status data.
 */
export function DeskFurniture({
  monitors = 3,
  glow,
  variant = "human",
  seated = true,
}: {
  monitors?: number;
  glow?: boolean;
  variant?: DeskVariant;
  seated?: boolean;
}) {
  const screenCount = Math.min(Math.max(monitors, 1), 3);
  const spread = screenCount === 1 ? [0] : screenCount === 2 ? [-15, 15] : [-24, 0, 24];

  return (
    <svg
      viewBox="0 0 160 110"
      className={cn("pointer-events-none h-16 w-24 sm:h-20 sm:w-28", deskGlow[variant])}
      aria-hidden
    >
      <ellipse cx="80" cy="98" rx="58" ry="8" className="fill-black/35" />

      {seated ? (
        <g opacity="0.9">
          <path
            d="M28 60 q-6 -22 14 -24 q18 -1 16 16"
            className="fill-none stroke-white/15"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <ellipse cx="34" cy="70" rx="11" ry="6" className="fill-white/10" />
        </g>
      ) : null}

      <polygon
        points="20,58 108,58 128,46 40,46"
        className="fill-[oklch(0.27_0.045_272)]"
        stroke="oklch(1 0 0 / 12%)"
      />
      <polygon points="20,58 108,58 108,70 20,70" className="fill-[oklch(0.185_0.035_267)]" />
      <polygon points="108,58 128,46 128,58 108,70" className="fill-[oklch(0.15_0.03_265)]" />

      <rect
        x="52"
        y="49.5"
        width="26"
        height="7"
        rx="1.5"
        className="fill-[oklch(0.34_0.04_270)]"
      />
      <rect x="22" y="69" width="84" height="2.4" rx="1.2" className="rgb-strip" />

      {spread.map((offset, index) => {
        const cx = 64 + offset;
        return (
          <g key={index} transform={`translate(${cx} 0)`}>
            <rect
              x="-14"
              y="16"
              width="28"
              height="19"
              rx="2"
              className="fill-[oklch(0.2_0.035_268)]"
            />
            <rect
              x="-11.5"
              y="18.2"
              width="23"
              height="14.6"
              rx="1.2"
              className={cn("fill-current transition-opacity", glow ? "opacity-90" : "opacity-25")}
              style={glow ? { filter: "drop-shadow(0 0 6px currentColor)" } : undefined}
            />
            <rect x="-2" y="35" width="4" height="6" className="fill-[oklch(0.25_0.035_268)]" />
          </g>
        );
      })}
    </svg>
  );
}

/** Curved reception counter with a standing monitor — the director's welcome desk. */
export function ReceptionDesk({ glow }: { glow?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 110"
      className="pointer-events-none h-20 w-32 text-primary sm:h-24 sm:w-40"
      aria-hidden
    >
      <ellipse cx="100" cy="96" rx="80" ry="9" className="fill-black/35" />
      <path
        d="M18 66 Q100 30 182 66 L182 82 Q100 46 18 82 Z"
        className="fill-[oklch(0.24_0.04_270)]"
        stroke="oklch(1 0 0 / 12%)"
      />
      <path
        d="M18 66 Q100 30 182 66"
        className="fill-none stroke-current opacity-70"
        strokeWidth="2"
      />
      <rect x="88" y="34" width="24" height="17" rx="2" className="fill-[oklch(0.2_0.035_268)]" />
      <rect
        x="90.5"
        y="36.2"
        width="19"
        height="12.4"
        rx="1"
        className={cn("fill-current", glow ? "opacity-90" : "opacity-25")}
        style={glow ? { filter: "drop-shadow(0 0 6px currentColor)" } : undefined}
      />
      <rect x="30" y="70" width="140" height="3" rx="1.5" className="rgb-strip" />
    </svg>
  );
}

/** Oval conference table with seat indicators — meeting-room header art, occupied seats glow. */
export function MeetingTable({ occupied = 0 }: { occupied?: number }) {
  const seats = Array.from({ length: 6 });
  return (
    <svg viewBox="0 0 200 90" className="pointer-events-none h-14 w-full text-primary" aria-hidden>
      <ellipse cx="100" cy="70" rx="86" ry="10" className="fill-black/30" />
      <ellipse
        cx="100"
        cy="44"
        rx="78"
        ry="24"
        className="fill-[oklch(0.2_0.035_268)]"
        stroke="oklch(1 0 0 / 12%)"
      />
      <ellipse cx="100" cy="42" rx="66" ry="18" className="fill-[oklch(0.24_0.045_272)]" />
      {seats.map((_, index) => {
        const angle = (index / seats.length) * Math.PI * 2;
        const cx = 100 + Math.cos(angle) * 82;
        const cy = 42 + Math.sin(angle) * 26;
        const active = index < occupied;
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="6"
            className={active ? "fill-current" : "fill-white/12"}
            style={active ? { filter: "drop-shadow(0 0 5px currentColor)" } : undefined}
          />
        );
      })}
    </svg>
  );
}

/** Lounge sofa + coffee table set. */
export function Sofa() {
  return (
    <svg
      viewBox="0 0 220 100"
      className="pointer-events-none h-16 w-full text-secondary"
      aria-hidden
    >
      <ellipse cx="70" cy="90" rx="62" ry="8" className="fill-black/30" />
      <rect
        x="14"
        y="46"
        width="112"
        height="30"
        rx="12"
        className="fill-[oklch(0.22_0.045_275)]"
        stroke="oklch(1 0 0 / 12%)"
      />
      <rect x="14" y="30" width="112" height="24" rx="12" className="fill-[oklch(0.28_0.05_278)]" />
      <rect x="20" y="34" width="24" height="16" rx="6" className="fill-current opacity-70" />
      <rect x="52" y="34" width="24" height="16" rx="6" className="fill-current opacity-50" />
      <rect x="84" y="34" width="24" height="16" rx="6" className="fill-current opacity-70" />
      <ellipse cx="176" cy="82" rx="30" ry="7" className="fill-black/25" />
      <ellipse
        cx="176"
        cy="70"
        rx="26"
        ry="10"
        className="fill-[oklch(0.18_0.03_265)]"
        stroke="oklch(1 0 0 / 10%)"
      />
    </svg>
  );
}

export function Plant({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 80"
      className={cn("pointer-events-none h-10 w-8 text-success", className)}
      aria-hidden
    >
      <ellipse cx="30" cy="74" rx="14" ry="3.5" className="fill-black/25" />
      <path
        d="M18 56 L42 56 L38 74 L22 74 Z"
        className="fill-[oklch(0.3_0.04_270)]"
        stroke="oklch(1 0 0 / 10%)"
      />
      <g className="fill-current" opacity="0.85">
        <path d="M30 56 C30 30 12 24 8 12 C22 14 30 30 30 46 Z" />
        <path d="M30 56 C30 26 48 20 52 8 C36 12 30 30 30 46 Z" />
        <path d="M30 56 C24 34 30 20 24 4 C34 10 34 30 30 46 Z" />
      </g>
    </svg>
  );
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const BOT_VISORS = [
  "oklch(0.78 0.145 205)",
  "oklch(0.62 0.18 292)",
  "oklch(0.72 0.16 155)",
  "oklch(0.8 0.15 80)",
  "oklch(0.7 0.19 25)",
];
const BOT_HEADS = ["oklch(0.9 0.01 260)", "oklch(0.86 0.02 270)", "oklch(0.93 0.015 250)"];

/**
 * Deterministic "personal" AI avatar — every hired AI employee gets its own distinct
 * face (visor colour, antenna, panel lines) derived from its own id, so no two AI
 * employees look alike, without needing an uploaded image.
 */
export function AiAvatarGlyph({ seed, active }: { seed: string; active?: boolean }) {
  const n = hashSeed(seed);
  const visor = BOT_VISORS[n % BOT_VISORS.length];
  const head = BOT_HEADS[(n >> 3) % BOT_HEADS.length];
  const antennaLeft = (n >> 5) % 2 === 0;
  const eyeCount = 2 + ((n >> 7) % 2);

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="oklch(0.19 0.035 268)" />
      <line
        x1={antennaLeft ? 20 : 44}
        y1="10"
        x2={antennaLeft ? 20 : 44}
        y2="2"
        stroke={visor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={antennaLeft ? 20 : 44} cy="2" r="2" fill={visor} />
      <rect x="14" y="14" width="36" height="34" rx="12" fill={head} />
      <rect x="18" y="27" width="28" height="12" rx="6" fill="oklch(0.14 0.03 265)" />
      {Array.from({ length: eyeCount }).map((_, index) => {
        const spacing = 28 / (eyeCount + 1);
        return (
          <rect
            key={index}
            x={18 + spacing * (index + 1) - 2.5}
            y="30.5"
            width="5"
            height="5"
            rx="2.5"
            fill={visor}
            style={active ? { filter: `drop-shadow(0 0 4px ${visor})` } : undefined}
          />
        );
      })}
      <rect x="10" y="44" width="8" height="6" rx="3" fill={head} />
      <rect x="46" y="44" width="8" height="6" rx="3" fill={head} />
    </svg>
  );
}

/**
 * A real person (or AI) rendered "seated" at their current floor position: photo/avatar
 * on top of a small torso silhouette so it visually reads as sitting in the chair,
 * plus a subtle idle breathing motion so the office feels alive rather than frozen.
 */
export function SeatedAvatar({
  children,
  tone = "primary",
  size = "md",
}: {
  children: ReactNode;
  tone?: "primary" | "secondary";
  size?: "md" | "lg";
}) {
  return (
    <div className={cn("relative flex flex-col items-center", size === "lg" ? "gap-0" : "gap-0")}>
      <div
        className={cn(
          "office-idle-bob relative z-10 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-transparent",
          tone === "primary" ? "ring-primary/60" : "ring-secondary/60",
          size === "lg" ? "size-12" : "size-9",
        )}
      >
        {children}
      </div>
      <span
        className={cn(
          "-mt-1 rounded-t-full opacity-90",
          tone === "primary" ? "bg-primary/25" : "bg-secondary/25",
          size === "lg" ? "h-6 w-16" : "h-5 w-12",
        )}
        aria-hidden
      />
    </div>
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
