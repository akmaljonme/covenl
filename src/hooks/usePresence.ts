import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { officeKeys, upsertPresence, type PresenceStatus } from "@/lib/api";

/**
 * Keeps the signed-in member's presence row fresh while they are in the office
 * and lets them change their own status. Presence is stored in the database so
 * every other member sees it through Realtime.
 */
export function usePresence({
  userId,
  companyId,
}: {
  userId: string | null;
  companyId: string | null;
}) {
  const queryClient = useQueryClient();

  const write = useCallback(
    (status: PresenceStatus) => {
      if (!userId) return Promise.resolve();
      return upsertPresence({ userId, companyId, status });
    },
    [userId, companyId],
  );

  useEffect(() => {
    if (!userId) return;
    void write("online");
    const heartbeat = window.setInterval(() => void write("online"), 45_000);
    const away = () => void write(document.visibilityState === "hidden" ? "away" : "online");
    document.addEventListener("visibilitychange", away);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", away);
      void write("offline");
    };
  }, [userId, write]);

  const setStatus = useMutation({
    mutationFn: (status: PresenceStatus) => write(status),
    onSuccess: () => {
      if (companyId) {
        void queryClient.invalidateQueries({ queryKey: officeKeys.presence(companyId) });
      }
    },
  });

  return { setStatus };
}
