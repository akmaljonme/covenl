import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor } from "lucide-react";

import { LogoWordmark } from "@/components/brand/Logo";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { fetchHiredAi, fetchProfile, fetchTeam, qk } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/office")({
  head: () => ({
    meta: [
      { title: "Virtual office — COVENL" },
      { name: "description", content: "Walk into your COVENL virtual office and see the Director, developers and AI employees at their desks." },
      { property: "og:title", content: "Virtual office — COVENL" },
      { property: "og:description", content: "Your COVENL virtual office floor." },
    ],
  }),
  component: OfficePage,
});

const statuses = ["ONLINE", "WORKING", "IN MEETING", "OFFLINE"] as const;
type Status = (typeof statuses)[number];

/** Demo status data for the MVP — derived deterministically so the floor is stable per member. */
function demoStatus(seed: string): Status {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return statuses[total % statuses.length]!;
}

const statusStyles: Record<Status, string> = {
  ONLINE: "border-success/50 text-success",
  WORKING: "border-primary/50 text-primary",
  "IN MEETING": "border-warning/50 text-warning",
  OFFLINE: "border-border text-muted-foreground",
};

function Desk({
  name,
  role,
  status,
  avatar,
  accent,
}: {
  name: string;
  role: string;
  status: Status;
  avatar: string;
  accent?: "director" | "ai";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 rounded-xl border bg-card/80 p-4 text-center backdrop-blur",
        accent === "director" ? "border-primary/50" : "border-border",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl border border-border text-sm font-semibold",
          accent === "ai" ? "bg-accent text-xl" : "bg-secondary text-secondary-foreground",
        )}
      >
        {avatar}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{role}</p>
      </div>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.12em]",
          statusStyles[status],
        )}
      >
        {status}
      </span>
      <span className="mt-1 h-1.5 w-16 rounded-full bg-border" aria-hidden="true" />
    </div>
  );
}

function OfficePage() {
  const { profile } = useAuth();
  const { company, isDirector, loading } = useWorkspace();

  const team = useQuery({
    queryKey: qk.team(company?.id ?? "none"),
    queryFn: () => fetchTeam(company!.id),
    enabled: Boolean(company?.id),
  });
  const hiredAi = useQuery({
    queryKey: qk.hiredAi(company?.id ?? "none"),
    queryFn: () => fetchHiredAi(company!.id),
    enabled: Boolean(company?.id),
  });
  const director = useQuery({
    queryKey: qk.profile(company?.owner_id ?? "none"),
    queryFn: () => fetchProfile(company!.owner_id!),
    enabled: Boolean(company?.owner_id),
  });

  if (loading) return <LoadingRow label="Opening the office" />;

  if (!company) {
    return (
      <>
        <PageHeader title="Virtual office" />
        <EmptyState
          title="No office yet"
          description={
            isDirector
              ? "Create your company to open its virtual office."
              : "Join a company team to enter its virtual office."
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
      </>
    );
  }

  const directorName =
    profile && company.owner_id === profile.id
      ? profile.full_name || "Director"
      : director.data?.full_name || "Director";

  return (
    <>
      <PageHeader
        title="Virtual office"
        description={`${company.name} · statuses are demo data for this MVP.`}
      />

      <section className="grid-floor panel overflow-hidden p-5 sm:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <LogoWordmark size={30} subtitle={`${company.name} office`} />
          <Badge variant="outline">
            {(team.data ?? []).length + (hiredAi.data ?? []).length + 1} on the floor
          </Badge>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <Desk
                name={directorName}
                role="Director"
                status="IN MEETING"
                avatar={getInitials(directorName)}
                accent="director"
              />
              {(team.data ?? []).map((member) => (
                <Desk
                  key={member.id}
                  name={member.developer?.full_name ?? "Developer"}
                  role={member.role_title}
                  status={demoStatus(member.id)}
                  avatar={getInitials(member.developer?.full_name ?? "Dev")}
                />
              ))}
              {(hiredAi.data ?? []).map((hire) => (
                <Desk
                  key={hire.id}
                  name={hire.ai_employee?.name ?? "AI Employee"}
                  role={hire.ai_employee?.role ?? "AI"}
                  status={demoStatus(hire.id)}
                  avatar={hire.ai_employee?.avatar ?? "🤖"}
                  accent="ai"
                />
              ))}
            </div>

            {(team.data ?? []).length === 0 && (hiredAi.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Only the Director desk is occupied. Accept a developer application or hire an AI
                employee to fill the floor.
              </p>
            ) : null}
          </div>

          <aside className="rounded-xl border border-dashed border-primary/40 bg-accent/30 p-5">
            <h2 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Meeting room
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {directorName} is running a stand-up. Live meetings arrive after the MVP.
            </p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="h-6 rounded-md border border-border bg-card/60" />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
