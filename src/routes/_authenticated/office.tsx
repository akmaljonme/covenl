import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Camera,
  DoorOpen,
  FolderKanban,
  LogIn,
  MessageSquare,
  Mic,
  Monitor,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LogoWordmark } from "@/components/brand/Logo";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { SkillList } from "@/components/common/SkillList";
import {
  AiAvatarGlyph,
  DeskFurniture,
  MeetingTable,
  NamePlate,
  Plant,
  ReceptionDesk,
  SeatedAvatar,
  Sofa,
  statusLabel,
  statusTone,
  StatusPill,
  ZoneLabel,
} from "@/components/office/OfficeParts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import {
  endMeeting,
  fetchHiredAi,
  fetchLiveMeetings,
  fetchPresence,
  fetchProfile,
  fetchTeam,
  joinMeeting,
  officeKeys,
  qk,
  startMeeting,
  updateAiTask,
  type HiredAiRow,
  type PresenceStatus,
  type TeamMemberRow,
} from "@/lib/api";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/office")({
  head: () => ({
    meta: [
      { title: "Virtual office — COVENL" },
      {
        name: "description",
        content:
          "Step into your COVENL headquarters: real team desks, hired AI employees, live meetings and realtime presence.",
      },
      { property: "og:title", content: "Virtual office — COVENL" },
      { property: "og:description", content: "Your live COVENL headquarters floor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OfficePage,
});

const DESK_SLOTS = 4;

function OfficePage() {
  const { profile, user } = useAuth();
  const { company, isDirector, loading } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const companyId = company?.id ?? null;

  const [openDeveloper, setOpenDeveloper] = useState<TeamMemberRow | null>(null);
  const [openAi, setOpenAi] = useState<HiredAiRow | null>(null);
  const [taskDraft, setTaskDraft] = useState("");

  usePresence({ userId: user?.id ?? null, companyId });

  const team = useQuery({
    queryKey: qk.team(companyId ?? "none"),
    queryFn: () => fetchTeam(companyId!),
    enabled: Boolean(companyId),
  });
  const hiredAi = useQuery({
    queryKey: qk.hiredAi(companyId ?? "none"),
    queryFn: () => fetchHiredAi(companyId!),
    enabled: Boolean(companyId),
  });
  const presence = useQuery({
    queryKey: officeKeys.presence(companyId ?? "none"),
    queryFn: () => fetchPresence(companyId!),
    enabled: Boolean(companyId),
  });
  const meetings = useQuery({
    queryKey: officeKeys.meetings(companyId ?? "none"),
    queryFn: () => fetchLiveMeetings(companyId!),
    enabled: Boolean(companyId),
  });
  const director = useQuery({
    queryKey: qk.profile(company?.owner_id ?? "none"),
    queryFn: () => fetchProfile(company!.owner_id!),
    enabled: Boolean(company?.owner_id),
  });

  // Realtime: any change to presence, meetings, team or AI hires refreshes the floor.
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`office-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, () => {
        void queryClient.invalidateQueries({ queryKey: officeKeys.presence(companyId) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, () => {
        void queryClient.invalidateQueries({ queryKey: officeKeys.meetings(companyId) });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meeting_participants" },
        () => {
          void queryClient.invalidateQueries({ queryKey: officeKeys.meetings(companyId) });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => {
        void queryClient.invalidateQueries({ queryKey: qk.team(companyId) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hired_ai_employees" }, () => {
        void queryClient.invalidateQueries({ queryKey: qk.hiredAi(companyId) });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, queryClient]);

  const presenceByUser = useMemo(() => {
    const map = new Map<string, PresenceStatus>();
    for (const row of presence.data ?? []) map.set(row.user_id, row.status);
    return map;
  }, [presence.data]);

  const statusOf = (userId: string | null | undefined): PresenceStatus =>
    (userId && presenceByUser.get(userId)) || "offline";

  const startMeetingMutation = useMutation({
    mutationFn: () =>
      startMeeting({
        companyId: companyId!,
        hostId: user!.id,
        title: `${company?.name ?? "Team"} stand-up`,
      }),
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: officeKeys.meetings(companyId!) });
      void navigate({ to: "/meeting/$meetingId", params: { meetingId: id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const joinMutation = useMutation({
    mutationFn: (meetingId: string) => joinMeeting(meetingId, user!.id),
    onSuccess: (_data, meetingId) => {
      void queryClient.invalidateQueries({ queryKey: officeKeys.meetings(companyId!) });
      void navigate({ to: "/meeting/$meetingId", params: { meetingId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const endMutation = useMutation({
    mutationFn: (meetingId: string) => endMeeting(meetingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: officeKeys.meetings(companyId!) }),
    onError: (error: Error) => toast.error(error.message),
  });

  const saveTask = useMutation({
    mutationFn: (input: { id: string; task: string }) => updateAiTask(input.id, input.task),
    onSuccess: () => {
      toast.success("Task updated");
      void queryClient.invalidateQueries({ queryKey: qk.hiredAi(companyId!) });
      setOpenAi(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) return <LoadingRow label="Opening the office" />;

  if (!company) {
    return (
      <EmptyState
        title="No office yet"
        description={
          isDirector
            ? "Create your company to open its virtual headquarters."
            : "Join a company team to enter its virtual headquarters."
        }
        icon={<Monitor className="size-6" />}
        action={
          <Button asChild>
            <Link to={isDirector ? "/company" : "/jobs"}>
              {isDirector ? "Create company" : "Browse jobs"}
            </Link>
          </Button>
        }
      />
    );
  }

  const directorName =
    profile && company.owner_id === profile.id
      ? profile.full_name || "Director"
      : director.data?.full_name || "Director";
  const teamRows = team.data ?? [];
  const aiRows = hiredAi.data ?? [];
  const liveMeetings = meetings.data ?? [];
  const onlineNow = (presence.data ?? []).filter((row) => row.status !== "offline");

  // ---------------------------------------------------------------------
  // Floor plan: every desk, meeting seat and lounge seat is a fixed point
  // on the stage. Who stands where is derived purely from real data
  // (presence.status + live meeting participants), so when that data
  // changes over realtime, the person/AI glides to their new spot.
  // ---------------------------------------------------------------------
  const RECEPTION_SLOT = { x: 16, y: 20 };
  const MEETING_SLOTS = [
    { x: 79, y: 14 },
    { x: 88, y: 20 },
    { x: 90, y: 32 },
    { x: 84, y: 40 },
    { x: 74, y: 36 },
    { x: 72, y: 24 },
  ];
  const DEV_SLOTS = [
    { x: 27, y: 46 },
    { x: 41, y: 43 },
    { x: 55, y: 46 },
    { x: 41, y: 57 },
  ];
  const AI_SLOTS = [
    { x: 27, y: 76 },
    { x: 41, y: 80 },
    { x: 55, y: 76 },
    { x: 41, y: 88 },
  ];
  const LOUNGE_SLOTS = [
    { x: 60, y: 62 },
    { x: 66, y: 68 },
    { x: 60, y: 74 },
    { x: 54, y: 68 },
  ];

  const meetingParticipantIds = new Set<string>();
  liveMeetings.forEach((meeting) => {
    if (meeting.host_id) meetingParticipantIds.add(meeting.host_id);
    meeting.participants.forEach((participant) => meetingParticipantIds.add(participant.user_id));
  });
  let meetingSeatCursor = 0;
  const nextMeetingSlot = () => MEETING_SLOTS[meetingSeatCursor++ % MEETING_SLOTS.length]!;
  let loungeSeatCursor = 0;
  const nextLoungeSlot = () => LOUNGE_SLOTS[loungeSeatCursor++ % LOUNGE_SLOTS.length]!;

  const directorInMeeting = company.owner_id ? meetingParticipantIds.has(company.owner_id) : false;
  const directorSlot = directorInMeeting ? nextMeetingSlot() : RECEPTION_SLOT;
  const directorStatus = statusOf(company.owner_id);

  const deskFor = (index: number, slots: typeof DEV_SLOTS) => slots[index % slots.length]!;

  return (
    <TooltipProvider delayDuration={120}>
      <section className="office-night relative overflow-hidden rounded-3xl border border-border p-4 sm:p-8">
        <span
          className="office-skyline pointer-events-none absolute inset-x-0 top-0 h-48 opacity-50"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-secondary/25 blur-3xl"
          aria-hidden
        />

        <header className="relative z-10 flex flex-col items-center gap-2 pb-8 text-center">
          <LogoWordmark size={40} />
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{company.name}</h1>
          <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Build Your Company
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline">{onlineNow.length} live now</Badge>
            <Badge variant="outline">{teamRows.length} developers</Badge>
            <Badge variant="outline">{aiRows.length} AI employees</Badge>
          </div>
        </header>

        <div className="office-floor relative z-10 rounded-2xl p-3 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
            {/* Living floor: reception, desks, AI bay and lounge on one continuous stage */}
            <div className="glass-zone office-stage p-0">
              <span
                className="office-skyline pointer-events-none absolute inset-x-0 top-0 z-0 h-24 opacity-70"
                aria-hidden
              />

              {/* Zone labels painted onto the floor */}
              <div className="pointer-events-none absolute top-3 left-3 z-10">
                <ZoneLabel icon={<DoorOpen className="size-3" />}>Reception</ZoneLabel>
              </div>
              <div className="pointer-events-none absolute top-3 right-3 z-10 text-right">
                <ZoneLabel icon={<Video className="size-3" />}>Meeting room</ZoneLabel>
              </div>
              <div className="pointer-events-none absolute top-[40%] left-3 z-10">
                <ZoneLabel icon={<Users className="size-3" />}>Developer bay</ZoneLabel>
              </div>
              <div className="pointer-events-none absolute top-[70%] left-3 z-10">
                <ZoneLabel icon={<Bot className="size-3" />}>AI bay</ZoneLabel>
              </div>
              <div className="pointer-events-none absolute top-[55%] right-4 z-10">
                <ZoneLabel icon={<Sparkles className="size-3" />}>Lounge</ZoneLabel>
              </div>

              {/* Glass divider hinting at the meeting room walls */}
              <div
                className="pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-[38%] border-l border-primary/20 bg-gradient-to-bl from-primary/10 via-transparent to-transparent"
                aria-hidden
              />

              {/* ---- Furniture (always visible, independent of who's seated) ---- */}
              <div
                className="office-furniture z-[5]"
                style={{ left: `${RECEPTION_SLOT.x}%`, top: `${RECEPTION_SLOT.y}%` }}
              >
                <ReceptionDesk glow={directorStatus !== "offline"} />
              </div>
              <div
                className="office-furniture z-[5]"
                style={{ left: "82%", top: "26%", width: "34%" }}
              >
                <MeetingTable occupied={meetingParticipantIds.size} />
              </div>
              {DEV_SLOTS.map((slot, index) => (
                <div
                  key={`dev-furniture-${index}`}
                  className="office-furniture z-[5]"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <DeskFurniture
                    monitors={3}
                    variant="human"
                    glow={Boolean(teamRows[index])}
                    seated={false}
                  />
                </div>
              ))}
              {AI_SLOTS.map((slot, index) => (
                <div
                  key={`ai-furniture-${index}`}
                  className="office-furniture z-[5]"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <DeskFurniture
                    monitors={2}
                    variant="ai"
                    glow={aiRows[index]?.status === "active"}
                    seated={false}
                  />
                </div>
              ))}
              <div
                className="office-furniture z-[5]"
                style={{ left: "60%", top: "70%", width: "26%" }}
              >
                <Sofa />
              </div>
              <Plant className="office-furniture z-[5]" />
              <span style={{ position: "absolute", left: "8%", top: "38%" }}>
                <Plant className="office-furniture z-[5]" />
              </span>
              <span style={{ position: "absolute", left: "92%", top: "60%" }}>
                <Plant className="office-furniture z-[5]" />
              </span>

              {/* ---- Director: real logged-in owner, walks to the meeting room when live ---- */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => void navigate({ to: "/dashboard" })}
                    className="office-actor z-20 flex flex-col items-center gap-1.5"
                    style={{ left: `${directorSlot.x}%`, top: `${directorSlot.y}%` }}
                  >
                    <SeatedAvatar size="lg">
                      <Avatar className="size-full">
                        <AvatarImage
                          src={director.data?.avatar_url ?? profile?.avatar_url ?? undefined}
                        />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {getInitials(directorName)}
                        </AvatarFallback>
                      </Avatar>
                    </SeatedAvatar>
                    <NamePlate name={directorName} role="Director" status={directorStatus} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {directorName} · Director ·{" "}
                  {directorInMeeting ? "in the meeting room" : "at reception"} — open company
                  dashboard
                </TooltipContent>
              </Tooltip>

              {/* ---- Developers: real team_members, walk to lounge/meeting by real presence ---- */}
              {Array.from({ length: Math.max(DESK_SLOTS, teamRows.length) }).map((_, index) => {
                const member = teamRows[index];
                const slot = deskFor(index, DEV_SLOTS);
                if (!member) {
                  return (
                    <Link
                      key={`open-${index}`}
                      to="/jobs"
                      className="office-actor z-20 flex flex-col items-center gap-1"
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    >
                      <NamePlate name="Open seat" role="Post a job" />
                    </Link>
                  );
                }
                const name = member.developer?.full_name ?? "Developer";
                const userId = member.developer?.user_id;
                const status = statusOf(userId);
                const inMeeting =
                  status === "meeting" && userId && meetingParticipantIds.has(userId);
                const currentSlot = inMeeting
                  ? nextMeetingSlot()
                  : status === "away"
                    ? nextLoungeSlot()
                    : slot;
                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setOpenDeveloper(member)}
                        className={cn(
                          "office-actor z-20 flex flex-col items-center gap-1.5",
                          status === "offline" && "opacity-40 grayscale",
                        )}
                        style={{ left: `${currentSlot.x}%`, top: `${currentSlot.y}%` }}
                      >
                        <SeatedAvatar>
                          <Avatar className="size-full">
                            <AvatarImage src={member.developer?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                        </SeatedAvatar>
                        <NamePlate name={name} role={member.role_title} status={status} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {name} · {member.role_title} ·{" "}
                      {member.developer?.headline || statusLabel[status]}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* ---- Hired AI employees: real hired_ai_employees, each with its own generated avatar ---- */}
              {Array.from({ length: Math.max(DESK_SLOTS, aiRows.length) }).map((_, index) => {
                const hire = aiRows[index];
                const slot = deskFor(index, AI_SLOTS);
                if (!hire) {
                  return (
                    <Link
                      key={`ai-open-${index}`}
                      to="/ai-employees"
                      className="office-actor z-20 flex flex-col items-center gap-1"
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    >
                      <NamePlate name="Free AI pod" role="Hire AI" />
                    </Link>
                  );
                }
                const active = hire.status === "active";
                return (
                  <Tooltip key={hire.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setOpenAi(hire);
                          setTaskDraft(hire.current_task ?? "");
                        }}
                        className={cn(
                          "office-actor z-20 flex flex-col items-center gap-1.5",
                          !active && "opacity-40 grayscale",
                        )}
                        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                      >
                        <SeatedAvatar tone="secondary">
                          <AiAvatarGlyph seed={hire.id} active={active} />
                        </SeatedAvatar>
                        <NamePlate
                          name={hire.ai_employee?.name ?? "AI employee"}
                          role={`${hire.ai_employee?.level ?? ""} · $${hire.ai_employee?.monthly_price ?? 0}/mo`}
                          status={active ? "working" : "offline"}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hire.ai_employee?.role ?? "AI"} ·{" "}
                      {hire.current_task ? hire.current_task : "No task assigned yet"}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Meeting room + quick access rail */}
            <div className="flex flex-col gap-4">
              <div className="glass-zone zone-accent-cyan flex flex-col gap-3 p-4">
                <ZoneLabel icon={<Video className="size-3.5" />}>Glass meeting room</ZoneLabel>
                {liveMeetings.length === 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">No meeting running right now.</p>
                    <Button
                      size="sm"
                      onClick={() => startMeetingMutation.mutate()}
                      disabled={startMeetingMutation.isPending}
                    >
                      <Video className="size-4" /> Start meeting
                    </Button>
                  </>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {liveMeetings.map((meeting) => (
                      <li
                        key={meeting.id}
                        className="rounded-xl border border-border bg-card/70 p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Hosted by {meeting.host?.full_name || "Director"} ·{" "}
                          {meeting.participants.length} in the room
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {meeting.participants.map((participant) => (
                            <Avatar key={participant.id} className="size-6">
                              <AvatarFallback className="bg-secondary text-[0.55rem] text-secondary-foreground">
                                {getInitials(participant.profile?.full_name || "M")}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => joinMutation.mutate(meeting.id)}
                            disabled={joinMutation.isPending}
                          >
                            <LogIn className="size-4" /> Join meeting
                          </Button>
                          {meeting.host_id === user?.id || company.owner_id === user?.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => endMutation.mutate(meeting.id)}
                              disabled={endMutation.isPending}
                            >
                              End
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="glass-zone flex flex-col gap-2 p-4">
                <ZoneLabel icon={<Sparkles className="size-3.5" />}>Team activity</ZoneLabel>
                {onlineNow.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nobody is online right now.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {onlineNow.slice(0, 6).map((row) => (
                      <li key={row.user_id} className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", statusTone[row.status])} />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                          {row.profile?.full_name || "Member"}
                        </span>
                        <span className="text-[0.6rem] tracking-[0.1em] text-muted-foreground uppercase">
                          {statusLabel[row.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="glass-zone flex flex-col gap-2 p-4">
                <ZoneLabel icon={<FolderKanban className="size-3.5" />}>Quick access</ZoneLabel>
                {[
                  { to: "/team", label: "Team roster" },
                  { to: "/applications", label: "Applications" },
                  { to: "/jobs", label: "Job board" },
                  { to: "/ai-employees", label: "AI marketplace" },
                  { to: "/company", label: "Company profile" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating dock */}
        <div className="relative z-20 mt-6 flex justify-center">
          <div className="glass-zone flex flex-wrap items-center justify-center gap-1 px-2 py-2">
            <DockButton
              icon={<Mic className="size-4" />}
              label="Voice"
              onClick={() =>
                liveMeetings[0]
                  ? joinMutation.mutate(liveMeetings[0]!.id)
                  : startMeetingMutation.mutate()
              }
            />
            <DockButton
              icon={<Camera className="size-4" />}
              label="Camera"
              onClick={() =>
                liveMeetings[0]
                  ? joinMutation.mutate(liveMeetings[0]!.id)
                  : startMeetingMutation.mutate()
              }
            />
            <DockButton
              icon={<MessageSquare className="size-4" />}
              label="Chat"
              onClick={() => void navigate({ to: "/messages" })}
            />
            <DockButton
              icon={<FolderKanban className="size-4" />}
              label="Projects"
              onClick={() => void navigate({ to: "/company" })}
            />
            <DockButton
              icon={<Bot className="size-4" />}
              label="AI"
              onClick={() => void navigate({ to: "/ai-employees" })}
            />
            <DockButton
              icon={<DoorOpen className="size-4" />}
              label="Leave office"
              onClick={() => void navigate({ to: "/dashboard" })}
            />
          </div>
        </div>
      </section>

      {/* Developer profile modal */}
      <Dialog
        open={Boolean(openDeveloper)}
        onOpenChange={(open) => !open && setOpenDeveloper(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openDeveloper?.developer?.full_name ?? "Developer"}</DialogTitle>
          </DialogHeader>
          {openDeveloper?.developer ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {openDeveloper.developer.headline || openDeveloper.role_title}
              </p>
              <StatusPill status={statusOf(openDeveloper.developer.user_id)} />
              <p className="text-sm text-muted-foreground">
                {openDeveloper.developer.bio || "No bio yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                {openDeveloper.developer.experience_years} years of experience
              </p>
              <SkillList skills={openDeveloper.developer.skills} max={8} />
              <Button asChild size="sm">
                <Link
                  to="/developers/$developerId"
                  params={{ developerId: openDeveloper.developer.id }}
                >
                  Open full profile
                </Link>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AI workspace modal */}
      <Dialog open={Boolean(openAi)} onOpenChange={(open) => !open && setOpenAi(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openAi?.ai_employee?.name ?? "AI employee"}</DialogTitle>
          </DialogHeader>
          {openAi?.ai_employee ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {openAi.ai_employee.role} · {openAi.ai_employee.level} · $
                {openAi.ai_employee.monthly_price}/mo
              </p>
              <p className="text-sm text-muted-foreground">{openAi.ai_employee.description}</p>
              <SkillList skills={openAi.ai_employee.skills} max={8} />
              <div className="flex flex-col gap-2">
                <label className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  Current task
                </label>
                <Input
                  value={taskDraft}
                  onChange={(event) => setTaskDraft(event.target.value)}
                  placeholder="e.g. Fix the checkout bug"
                  disabled={!isDirector}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {isDirector ? (
                  <Button
                    size="sm"
                    onClick={() => saveTask.mutate({ id: openAi.id, task: taskDraft })}
                    disabled={saveTask.isPending}
                  >
                    Save task
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/ai-employees/$aiEmployeeId"
                    params={{ aiEmployeeId: openAi.ai_employee.id }}
                  >
                    Open AI workspace
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function DockButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-foreground",
          )}
        >
          {icon}
          <span className="text-[0.6rem] tracking-[0.1em] uppercase">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
