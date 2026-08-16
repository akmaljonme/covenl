import { cn } from "@/lib/utils";
import { statusTone } from "@/components/office/OfficeParts";
import type { PresenceStatus } from "@/lib/api";

/** Stable 0-360 hue from a name so every person keeps the same character colors. */
export function hueOf(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }
  return hash;
}

type CharacterKind = "human" | "robot" | "director";

/**
 * Pure-CSS isometric character used for every person on the office floor.
 * Colors are derived from the person's name, so avatars are consistent per user.
 */
export function Character({
  name,
  kind = "human",
  status,
  size = 56,
  walking = false,
  className,
}: {
  name: string;
  kind?: CharacterKind;
  status?: PresenceStatus;
  size?: number;
  walking?: boolean;
  className?: string;
}) {
  const hue = hueOf(name || "member");
  const skin = kind === "robot" ? `hsl(${hue} 20% 82%)` : `hsl(${(hue + 25) % 360} 45% 74%)`;
  const shirt = kind === "robot" ? `hsl(${hue} 65% 45%)` : `hsl(${hue} 60% 48%)`;
  const hair = kind === "robot" ? `hsl(${hue} 70% 60%)` : `hsl(${(hue + 200) % 360} 30% 22%)`;

  return (
    <span
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size, height: size * 1.25 }}
      aria-hidden
    >
      {/* ground shadow */}
      <span
        className="absolute bottom-0 rounded-[50%] bg-black/45 blur-[2px]"
        style={{ width: size * 0.62, height: size * 0.16 }}
      />
      <span
        className={cn("relative flex flex-col items-center", walking && "office-walk")}
        style={{ width: size, height: size * 1.15 }}
      >
        {/* head */}
        <span
          className="relative rounded-full border border-black/25"
          style={{ width: size * 0.42, height: size * 0.42, background: skin }}
        >
          {kind === "robot" ? (
            <>
              <span
                className="absolute -top-[22%] left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: 2, height: size * 0.16, background: hair }}
              />
              <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[3px]"
                style={{ width: size * 0.24, height: size * 0.1, background: shirt }}
              />
            </>
          ) : (
            <span
              className="absolute -top-[8%] left-1/2 -translate-x-1/2 rounded-t-full"
              style={{ width: size * 0.44, height: size * 0.2, background: hair }}
            />
          )}
        </span>
        {/* torso */}
        <span
          className="mt-[-4%] rounded-t-[40%] rounded-b-[24%] border border-black/20"
          style={{ width: size * 0.5, height: size * 0.45, background: shirt }}
        />
        {/* legs */}
        <span className="flex gap-[10%]" style={{ width: size * 0.4 }}>
          <span
            className="office-leg-l rounded-b-sm"
            style={{ width: size * 0.13, height: size * 0.22, background: hair }}
          />
          <span
            className="office-leg-r rounded-b-sm"
            style={{ width: size * 0.13, height: size * 0.22, background: hair }}
          />
        </span>
      </span>
      {status ? (
        <span
          className={cn(
            "absolute top-0 right-0 size-2.5 rounded-full ring-2 ring-background",
            statusTone[status],
          )}
        />
      ) : null}
    </span>
  );
}
