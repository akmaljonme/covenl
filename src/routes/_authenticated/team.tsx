import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SkillList } from "@/components/common/SkillList";
import { EmptyState, LoadingCards } from "@/components/common/States";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { fetchHiredAi, fetchProfile, fetchTeam, qk } from "@/lib/api";
import { getInitials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — COVENL" },
      { name: "description", content: "See the Director, developers and AI employees that make up your company team." },
      { property: "og:title", content: "Team — COVENL" },
      { property: "og:description", content: "Your COVENL company team." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { isDirector, company, loading } = useWorkspace();
  const { profile } = useAuth();

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

  if (loading) return <LoadingCards />;

  if (!company) {
    return (
      <>
        <PageHeader title="Team" />
        <EmptyState
          title="No company team yet"
          description={
            isDirector
              ? "Create your company, then accept developers to build your team."
              : "Once a Director accepts your application you will see their team here."
          }
          icon={<Users className="size-6" />}
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
    company.owner_id && profile && company.owner_id === profile.id
      ? profile.full_name || "You"
      : director.data?.full_name || "Demo Director";

  return (
    <>
      <PageHeader
        title="Team"
        description={`Everyone working inside ${company.name}.`}
        actions={
          isDirector ? (
            <Button asChild variant="outline">
              <Link to="/ai-employees">Hire AI employee</Link>
            </Button>
          ) : null
        }
      />

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Director
        </h2>
        <div className="panel flex items-center gap-3 p-5">
          <Avatar className="size-11">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {getInitials(directorName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold text-foreground">{directorName}</p>
            <p className="text-sm text-muted-foreground">Director · {company.name}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Developers
        </h2>
        {team.isLoading ? <LoadingCards count={2} /> : null}
        {!team.isLoading && (team.data ?? []).length === 0 ? (
          <EmptyState
            title="No developers hired yet"
            description="Accept an application to add your first developer."
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(team.data ?? []).map((member) => (
            <article key={member.id} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {getInitials(member.developer?.full_name ?? "Dev")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {member.developer?.full_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{member.role_title}</p>
                </div>
              </div>
              <SkillList skills={member.developer?.skills ?? []} max={4} />
              {member.developer ? (
                <Button asChild size="sm" variant="outline" className="self-start">
                  <Link to="/developers/$developerId" params={{ developerId: member.developer.id }}>
                    View profile
                  </Link>
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          AI employees
        </h2>
        {!hiredAi.isLoading && (hiredAi.data ?? []).length === 0 ? (
          <EmptyState
            title="No AI employees yet"
            description="Hire an AI employee from the marketplace to expand your team instantly."
            action={
              isDirector ? (
                <Button asChild>
                  <Link to="/ai-employees">Browse AI employees</Link>
                </Button>
              ) : undefined
            }
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(hiredAi.data ?? []).map((hire) => (
            <article key={hire.id} className="panel flex items-center gap-3 p-5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-accent text-lg">
                {hire.ai_employee?.avatar ?? "🤖"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {hire.ai_employee?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hire.ai_employee?.role} · ${hire.ai_employee?.monthly_price}/mo
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {hire.ai_employee?.level}
              </Badge>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
