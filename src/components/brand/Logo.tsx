import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
};

/** COVENL mark: open white "C" in a navy/purple rounded square with a cyan dot in the opening. */
export function LogoMark({ size = 36, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-secondary",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size * 0.68} height={size * 0.68}>
        <path
          d="M36 13a16 16 0 1 0 0 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          className="text-foreground"
        />
        <circle cx="39" cy="24" r="4.6" className="fill-primary" />
      </svg>
    </span>
  );
}

export function LogoWordmark({
  size = 32,
  className,
  subtitle,
}: LogoProps & { subtitle?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-semibold tracking-[0.22em] text-foreground">
          COVENL
        </span>
        {subtitle ? (
          <span className="mt-1 text-[0.6rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
