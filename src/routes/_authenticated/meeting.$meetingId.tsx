import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, LoadingRow } from "@/components/common/States";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { endMeeting, fetchMeeting, joinMeeting, leaveMeeting, officeKeys } from "@/lib/api";
import { getInitials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/meeting/$meetingId")({
  head: () => ({
    meta: [
      { title: "Live meeting — COVENL" },
      {
        name: "description",
        content: "Join your COVENL team meeting room with live participants and realtime presence.",
      },
      { property: "og:title", content: "Live meeting — COVENL" },
      { property: "og:description", content: "COVENL live meeting room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetingRoom,
});

function MeetingRoom() {
  const { meetingId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);

  const meeting = useQuery({
    queryKey: officeKeys.meeting(meetingId),
    queryFn: () => fetchMeeting(meetingId),
  });

  useEffect(() => {
    if (!user?.id) return;
    void joinMeeting(meetingId, user.id).catch(() => undefined);
    return () => {
      void leaveMeeting(meetingId, user.id).catch(() => undefined);
    };
  }, [meetingId, user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_participants" }, () => {
        void queryClient.invalidateQueries({ queryKey: officeKeys.meeting(meetingId) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, () => {
        void queryClient.invalidateQueries({ queryKey: officeKeys.meeting(meetingId) });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meetingId, queryClient]);

  const end = useMutation({
    mutationFn: () => endMeeting(meetingId),
    onSuccess: () => {
      toast.success("Meeting ended");
      void navigate({ to: "/office" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (meeting.isLoading) return <LoadingRow label="Entering the meeting room" />;

  const row = meeting.data;
  if (!row) {
    return (
      <EmptyState
        title="Meeting not found"
        description="This meeting has ended or you do not have access to it."
        icon={<Video className="size-6" />}
        action={
          <Button asChild>
            <Link to="/office">Back to office</Link>
          </Button>
        }
      />
    );
  }

  const isHost = row.host_id === user?.id;

  return (
    <section className="office-night relative overflow-hidden rounded-3xl border border-border p-4 sm:p-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <Badge variant="outline">{row.status === "live" ? "Live" : "Ended"}</Badge>
        <h1 className="text-2xl font-semibold text-foreground">{row.title}</h1>
        <p className="text-sm text-muted-foreground">
          Hosted by {row.host?.full_name || "Director"} · {row.participants.length} in the room
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {row.participants.map((participant) => (
          <div
            key={participant.id}
            className="glass-zone flex aspect-video flex-col items-center justify-center gap-3"
          >
            <Avatar className="size-16 ring-2 ring-primary/40">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {getInitials(participant.profile?.full_name || "Member")}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-foreground">
              {participant.profile?.full_name || "Member"}
            </p>
          </div>
        ))}
        {row.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Waiting for participants…</p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="glass-zone flex items-center gap-2 px-3 py-2">
          <Button variant="outline" size="sm" onClick={() => setMicOn((value) => !value)}>
            {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />} Mic
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCamOn((value) => !value)}>
            {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />} Camera
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/office">Leave</Link>
          </Button>
          {isHost ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => end.mutate()}
              disabled={end.isPending}
            >
              <PhoneOff className="size-4" /> End meeting
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
