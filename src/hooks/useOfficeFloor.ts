import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { PresenceStatus } from "@/lib/api";

export type Walker = {
  userId: string;
  name: string;
  role: string;
  status: PresenceStatus;
  x: number;
  y: number;
  facing: 1 | -1;
  walking: boolean;
};

type Self = {
  userId: string | null;
  name: string;
  role: string;
  status: PresenceStatus;
};

const SPEED = 26; // percent of floor width per second
const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  W: [0, -1],
  S: [0, 1],
  A: [-1, 0],
  D: [1, 0],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Local walkable avatar (keyboard + click-to-walk) synced to every other person
 * in the same company office through a Supabase Realtime presence channel.
 */
export function useOfficeFloor({ companyId, self }: { companyId: string | null; self: Self }) {
  const [me, setMe] = useState({ x: 50, y: 78, facing: 1 as 1 | -1, walking: false });
  const [others, setOthers] = useState<Walker[]>([]);

  const posRef = useRef(me);
  const keysRef = useRef(new Set<string>());
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const selfRef = useRef(self);
  selfRef.current = self;

  /* --- keyboard --- */
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (!KEYS[event.key]) return;
      event.preventDefault();
      keysRef.current.add(event.key);
      targetRef.current = null;
    };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* --- movement loop --- */
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      let dx = 0;
      let dy = 0;
      for (const key of keysRef.current) {
        const vector = KEYS[key];
        if (vector) {
          dx += vector[0];
          dy += vector[1];
        }
      }

      const current = posRef.current;
      let next = { ...current, walking: false };

      if (dx || dy) {
        const length = Math.hypot(dx, dy) || 1;
        next = {
          x: clamp(current.x + (dx / length) * SPEED * delta, 4, 96),
          y: clamp(current.y + (dy / length) * SPEED * delta * 0.7, 18, 94),
          facing: dx === 0 ? current.facing : dx > 0 ? 1 : -1,
          walking: true,
        };
      } else if (targetRef.current) {
        const to = targetRef.current;
        const diffX = to.x - current.x;
        const diffY = to.y - current.y;
        const distance = Math.hypot(diffX, diffY);
        if (distance < 0.7) {
          targetRef.current = null;
        } else {
          next = {
            x: clamp(current.x + (diffX / distance) * SPEED * delta, 4, 96),
            y: clamp(current.y + (diffY / distance) * SPEED * delta * 0.7, 18, 94),
            facing: diffX === 0 ? current.facing : diffX > 0 ? 1 : -1,
            walking: true,
          };
        }
      }

      if (
        next.x !== current.x ||
        next.y !== current.y ||
        next.walking !== current.walking ||
        next.facing !== current.facing
      ) {
        posRef.current = next;
        setMe(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* --- realtime co-presence --- */
  useEffect(() => {
    if (!companyId || !self.userId) return;
    const channel = supabase.channel(`office-floor-${companyId}`, {
      config: { presence: { key: self.userId } },
    });
    channelRef.current = channel;

    const sync = () => {
      const state = channel.presenceState<Record<string, unknown>>();
      const list: Walker[] = [];
      for (const [key, entries] of Object.entries(state)) {
        if (key === self.userId) continue;
        const entry = entries[entries.length - 1] as unknown as Partial<Walker> | undefined;
        if (!entry) continue;
        list.push({
          userId: key,
          name: String(entry.name ?? "Member"),
          role: String(entry.role ?? "Team"),
          status: (entry.status ?? "online") as PresenceStatus,
          x: Number(entry.x ?? 50),
          y: Number(entry.y ?? 80),
          facing: entry.facing === -1 ? -1 : 1,
          walking: Boolean(entry.walking),
        });
      }
      setOthers(list);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        const current = posRef.current;
        void channel.track({ ...selfRef.current, ...current });
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [companyId, self.userId]);

  /* --- throttled broadcast of my position --- */
  useEffect(() => {
    if (!companyId || !self.userId) return;
    const interval = window.setInterval(() => {
      const channel = channelRef.current;
      if (!channel) return;
      void channel.track({ ...selfRef.current, ...posRef.current });
    }, 220);
    return () => window.clearInterval(interval);
  }, [companyId, self.userId]);

  const walkTo = useCallback((x: number, y: number) => {
    keysRef.current.clear();
    targetRef.current = { x: clamp(x, 4, 96), y: clamp(y, 18, 94) };
  }, []);

  return { me, others, walkTo };
}
