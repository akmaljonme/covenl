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
import { DeskFurniture, Plant, StatusPill, ZoneLabel } from "@/components/office/OfficeParts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hired_ai_employees" },
        () => {
          void queryClient.invalidateQueries({ queryKey: qk.hiredAi(companyId) });
        },
      )
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

        <div className="office-floor iso-stage relative z-10 grid gap-4 rounded-2xl p-3 sm:p-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Reception */}
          <div className="glass-zone flex flex-col gap-4 p-4">
            <ZoneLabel icon={<DoorOpen className="size-3.5" />}>Director reception</ZoneLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => void navigate({ to: "/dashboard" })}
                  className="desk-pod group flex flex-col items-center gap-3 p-4 text-center transition-transform hover:-translate-y-1"
                >
                  <DeskFurniture monitors={2} glow />
                  <Avatar className="size-12 ring-2 ring-primary/50">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {getInitials(directorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{directorName}</p>
                    <p className="text-xs text-muted-foreground">Director</p>
                  </div>
                  <StatusPill status={statusOf(company.owner_id)} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {directorName} · Director · running {company.name} — open company dashboard
              </TooltipContent>
            </Tooltip>
            <div className="flex items-end justify-between">
              <Plant />
              <span className="h-10 w-16 rounded-t-2xl border border-border bg-card/60" aria-hidden />
              <Plant />
            </div>
          </div>

          {/* Desk floor */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-zone flex flex-col gap-3 p-4">
                <ZoneLabel icon={<Users className="size-3.5" />}>Developer bay</ZoneLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: Math.max(DESK_SLOTS, teamRows.length) }).map(
                    (_, index) => {
                      const member = teamRows[index];
                      if (!member) {
                        return (
                          <Link
                            key={`open-${index}`}
                            to="/jobs"
                            className="desk-pod flex flex-col items-center gap-2 p-3 text-center opacity-60 transition hover:opacity-100"
                          >
                            <DeskFurniture monitors={3} />
                            <p className="text-xs text-muted-foreground">Open seat</p>
                            <span className="text-[0.6rem] tracking-[0.14em] text-primary uppercase">
                              Post a job
                            </span>
                          </Link>
                        );
                      }
                      const name = member.developer?.full_name ?? "Developer";
                      const status = statusOf(member.developer?.user_id);
                      return (
                        <Tooltip key={member.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setOpenDeveloper(member)}
                              className="desk-pod flex flex-col items-center gap-2 p-3 text-center transition-transform hover:-translate-y-1"
                            >
                              <DeskFurniture monitors={3} glow={status !== "offline"} />
                              <Avatar className="size-10">
                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                  {getInitials(name)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="w-full truncate text-sm font-semibold text-foreground">
                                {name}
                              </p>
                              <p className="w-full truncate text-xs text-muted-foreground">
                                {member.role_title}
                              </p>
                              <StatusPill status={status} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {name} · {member.role_title} ·{" "}
                            {member.developer?.headline || "No current headline"}
                          </TooltipContent>
                        </Tooltip>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="glass-zone flex flex-col gap-3 p-4">
                <ZoneLabel icon={<Bot className="size-3.5" />}>AI employee bay</ZoneLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: Math.max(DESK_SLOTS, aiRows.length) }).map((_, index) => {
                    const hire = aiRows[index];
                    if (!hire) {
                      return (
                        <Link
                          key={`ai-open-${index}`}
                          to="/ai-employees"
                          className="desk-pod flex flex-col items-center gap-2 p-3 text-center opacity-60 transition hover:opacity-100"
                        >
                          <DeskFurniture monitors={2} />
                          <p className="text-xs text-muted-foreground">Free AI pod</p>
                          <span className="text-[0.6rem] tracking-[0.14em] text-primary uppercase">
                            Hire AI
                          </span>
                        </Link>
                      );
                    }
                    return (
                      <Tooltip key={hire.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setOpenAi(hire);
                              setTaskDraft(hire.current_task ?? "");
                            }}
                            className="desk-pod flex flex-col items-center gap-2 p-3 text-center transition-transform hover:-translate-y-1"
                          >
                            <DeskFurniture monitors={2} glow={hire.status === "active"} />
                            <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-accent text-lg">
                              {hire.ai_employee?.avatar ?? "🤖"}
                            </span>
                            <p className="w-full truncate text-sm font-semibold text-foreground">
                              {hire.ai_employee?.name ?? "AI employee"}
                            </p>
                            <p className="w-full truncate text-xs text-muted-foreground">
                              {hire.ai_employee?.level} · ${hire.ai_employee?.monthly_price}/mo
                            </p>
                            <StatusPill status={hire.status === "active" ? "working" : "offline"} />
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
              </div>
            </div>

            {/* Lounge */}
            <div className="glass-zone flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <ZoneLabel icon={<Sparkles className="size-3.5" />}>Lounge</ZoneLabel>
                <Plant />
              </div>
              {onlineNow.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  The lounge is quiet — nobody is in the office right now.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {onlineNow.map((row) => (
                    <li
                      key={row.user_id}
                      className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-secondary text-[0.6rem] text-secondary-foreground">
                          {getInitials(row.profile?.full_name || "Member")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground">
                        {row.profile?.full_name || "Member"}
                      </span>
                      <StatusPill status={row.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Meeting room + quick access */}
          <div className="flex flex-col gap-4">
            <div className="glass-zone flex flex-col gap-3 border-primary/30 p-4">
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
                    <li key={meeting.id} className="rounded-xl border border-border bg-card/70 p-3">
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
              <div className="grid grid-cols-4 gap-1.5 pt-1" aria-hidden>
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} className="h-5 rounded-md border border-border bg-card/50" />
                ))}
              </div>
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
      <Dialog open={Boolean(openDeveloper)} onOpenChange={(open) => !open && setOpenDeveloper(null)}>
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
