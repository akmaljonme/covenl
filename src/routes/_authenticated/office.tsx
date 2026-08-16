import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Camera,
  DoorOpen,
  FolderKanban,
  MessageSquare,
  Mic,
  Monitor,
  MoreHorizontal,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import officeFloor from "@/assets/office-floor.jpg";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { SkillList } from "@/components/common/SkillList";
import { StatusPill, statusLabel, statusTone } from "@/components/office/OfficeParts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

/** Desk anchor points measured against the rendered office floor image. */
const DEV_DESKS = [
  { left: "34%", top: "33%" },
  { left: "48.5%", top: "33%" },
  { left: "62%", top: "33%" },
];
const AI_DESKS = [
  { left: "21%", top: "64%" },
  { left: "75%", top: "64%" },
];
const RECEPTION = { left: "50%", top: "11%" };
const MEETING_ROOM = { left: "81%", top: "20%" };

function OfficePage() {
  const { profile, user } = useAuth();
  const { company, isDirector, loading } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const companyId = company?.id ?? null;

  const [openDeveloper, setOpenDeveloper] = useState<TeamMemberRow | null>(null);
  const [openAi, setOpenAi] = useState<HiredAiRow | null>(null);
  const [taskDraft, setTaskDraft] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

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
  const liveMeeting = liveMeetings[0] ?? null;

  const enterMeeting = () =>
    liveMeeting ? joinMutation.mutate(liveMeeting.id) : startMeetingMutation.mutate();

  const activity = [
    ...teamRows.slice(0, 5).map((member) => ({
      id: `dev-${member.id}`,
      name: member.developer?.full_name ?? "Developer",
      detail: member.developer?.headline || member.role_title,
      status: statusOf(member.developer?.user_id),
    })),
    ...aiRows.slice(0, 5).map((hire) => ({
      id: `ai-${hire.id}`,
      name: hire.ai_employee?.name ?? "AI employee",
      detail: hire.current_task || hire.ai_employee?.role || "Idle",
      status: (hire.status === "active" ? "working" : "offline") as PresenceStatus,
    })),
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-background">
        {/* Rendered HQ floor */}
        <div className="relative aspect-[16/10] w-full">
          <img
            src={officeFloor}
            alt={`${company.name} virtual headquarters floor`}
            width={1920}
            height={1200}
            className="absolute inset-0 size-full object-cover"
          />
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/70"
            aria-hidden
          />

          {/* Company sign */}
          <div className="absolute top-3 left-4 z-20 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur-md sm:top-5 sm:left-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
              {company.name}
            </p>
            <p className="text-[0.6rem] tracking-[0.28em] text-primary uppercase">
              Build your company
            </p>
          </div>

          {/* Online now */}
          <div className="absolute top-3 right-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur-md sm:top-5 sm:right-6">
            <span className="text-[0.6rem] leading-tight tracking-[0.14em] text-muted-foreground uppercase">
              Online
              <br />
              now
            </span>
            <div className="flex -space-x-2">
              {onlineNow.slice(0, 4).map((row) => (
                <Avatar key={row.user_id} className="size-7 ring-2 ring-background">
                  <AvatarFallback className="bg-secondary text-[0.55rem] text-secondary-foreground">
                    {getInitials(row.profile?.full_name || "Member")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {onlineNow.length > 4 ? (
              <span className="text-xs text-muted-foreground">+{onlineNow.length - 4}</span>
            ) : null}
          </div>

          {/* Director at reception */}
          <Nameplate
            position={RECEPTION}
            name={directorName}
            role="Director"
            status={statusOf(company.owner_id)}
            tooltip={`${directorName} · Director · open company dashboard`}
            onClick={() => void navigate({ to: "/dashboard" })}
          />

          {/* Meeting room */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={enterMeeting}
                style={{ left: MEETING_ROOM.left, top: MEETING_ROOM.top }}
                className="absolute z-20 -translate-x-1/2 rounded-lg border border-primary/40 bg-background/75 px-3 py-1.5 text-center backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary"
              >
                <p className="text-xs font-semibold text-foreground">Meeting Room</p>
                <p className="text-[0.6rem] text-muted-foreground">
                  {liveMeeting
                    ? `Live · ${liveMeeting.participants.length} inside`
                    : "Start a meeting"}
                </p>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {liveMeeting
                ? `${liveMeeting.title} — hosted by ${liveMeeting.host?.full_name || "Director"}`
                : "No meeting running — click to start one"}
            </TooltipContent>
          </Tooltip>

          {liveMeeting && (liveMeeting.host_id === user?.id || company.owner_id === user?.id) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => endMutation.mutate(liveMeeting.id)}
              disabled={endMutation.isPending}
              className="absolute z-20 -translate-x-1/2"
              style={{ left: MEETING_ROOM.left, top: "30%" }}
            >
              End meeting
            </Button>
          ) : null}

          {/* Developer desks */}
          {DEV_DESKS.map((slot, index) => {
            const member = teamRows[index];
            if (!member) {
              return (
                <Tooltip key={`open-desk-${index}`}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/jobs"
                      style={slot}
                      className="absolute z-20 -translate-x-1/2 rounded-lg border border-dashed border-border bg-background/60 px-3 py-1.5 text-center backdrop-blur-md transition hover:border-primary"
                    >
                      <p className="text-xs font-semibold text-foreground">Open seat</p>
                      <p className="text-[0.6rem] tracking-[0.14em] text-primary uppercase">
                        Post a job
                      </p>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Empty desk — hire a developer</TooltipContent>
                </Tooltip>
              );
            }
            const name = member.developer?.full_name ?? "Developer";
            return (
              <Nameplate
                key={member.id}
                position={slot}
                name={name}
                role={member.role_title}
                status={statusOf(member.developer?.user_id)}
                tooltip={`${name} · ${member.role_title} · ${member.developer?.headline || "No headline yet"}`}
                onClick={() => setOpenDeveloper(member)}
              />
            );
          })}

          {/* AI desks */}
          {AI_DESKS.map((slot, index) => {
            const hire = aiRows[index];
            if (!hire) {
              return (
                <Tooltip key={`open-ai-${index}`}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/ai-employees"
                      style={slot}
                      className="absolute z-20 -translate-x-1/2 rounded-lg border border-dashed border-border bg-background/60 px-3 py-1.5 text-center backdrop-blur-md transition hover:border-primary"
                    >
                      <p className="text-xs font-semibold text-foreground">Free AI pod</p>
                      <p className="text-[0.6rem] tracking-[0.14em] text-primary uppercase">
                        Hire AI
                      </p>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Empty AI pod — hire an AI employee</TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Nameplate
                key={hire.id}
                position={slot}
                name={hire.ai_employee?.name ?? "AI employee"}
                role={`${hire.ai_employee?.level ?? "AI"} · $${hire.ai_employee?.monthly_price ?? 0}/mo`}
                status={hire.status === "active" ? "working" : "offline"}
                tooltip={`${hire.ai_employee?.role ?? "AI"} · ${hire.current_task || "No task assigned yet"}`}
                onClick={() => {
                  setOpenAi(hire);
                  setTaskDraft(hire.current_task ?? "");
                }}
              />
            );
          })}




          {/* Floating dock */}
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-background/80 px-2 py-2 backdrop-blur-xl">
              <DockButton icon={<Mic className="size-4" />} label="Mic" onClick={enterMeeting} />
              <DockButton
                icon={<Camera className="size-4" />}
                label="Camera"
                onClick={enterMeeting}
              />
              <DockButton
                icon={<MessageSquare className="size-4" />}
                label="Chat"
                onClick={() => void navigate({ to: "/messages" })}
              />
              <DockButton
                icon={<MoreHorizontal className="size-4" />}
                label="More"
                onClick={() => setMoreOpen(true)}
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void navigate({ to: "/dashboard" })}
                className="ml-1"
              >
                <DoorOpen className="size-4" /> Leave Office
              </Button>
            </div>
          </div>
        </div>

        {/* Floor summary (mobile-friendly, real counts) */}
        <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3">
          <FloorStat
            icon={<Users className="size-4" />}
            label="Developers"
            value={teamRows.length}
            to="/team"
          />
          <FloorStat
            icon={<Bot className="size-4" />}
            label="AI employees"
            value={aiRows.length}
            to="/ai-employees"
          />
          <FloorStat
            icon={<Video className="size-4" />}
            label="Online now"
            value={onlineNow.length}
            to="/office"
          />
        </div>

        {/* Team activity */}
        <div className="border-t border-border p-4">
          <p className="text-[0.6rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Team activity
          </p>
          {activity.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No team members yet.</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <span
                    className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", statusTone[item.status])}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                    <p className="truncate text-[0.65rem] text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </section>

      {/* More menu */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Office shortcuts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
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
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

function Nameplate({
  position,
  name,
  role,
  status,
  tooltip,
  onClick,
}: {
  position: { left: string; top: string };
  name: string;
  role: string;
  status: PresenceStatus;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          style={position}
          className="absolute z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary"
        >
          <span className={cn("size-2 shrink-0 rounded-full", statusTone[status])} />
          <span className="text-left">
            <span className="block max-w-28 truncate text-xs font-semibold text-foreground">
              {name}
            </span>
            <span className="block max-w-28 truncate text-[0.6rem] text-muted-foreground">
              {role}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {tooltip} · {statusLabel[status]}
      </TooltipContent>
    </Tooltip>
  );
}

function FloorStat({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2 transition-colors hover:bg-accent"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <span>
        <span className="block text-lg font-semibold text-foreground">{value}</span>
        <span className="block text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </span>
      </span>
    </Link>
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
            "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-muted-foreground transition-colors",
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
