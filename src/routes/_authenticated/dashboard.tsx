import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Briefcase, ClipboardList, FileText, Monitor, Rocket, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  fetchCompanyApplications,
  fetchDeveloperApplications,
  fetchHiredAi,
  fetchJobs,
  fetchTeam,
  qk,
} from "@/lib/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — COVENL" },
      { name: "description", content: "Your COVENL workspace overview: team, jobs, applications and AI employees." },
      { property: "og:title", content: "Dashboard — COVENL" },
      { property: "og:description", content: "Your COVENL workspace overview." },
    ],
  }),
  component: DashboardPage,
});

function DirectorDashboard({ companyId, companyName }: { companyId: string; companyName: string }) {
  const team = useQuery({ queryKey: qk.team(companyId), queryFn: () => fetchTeam(companyId) });
  const jobs = useQuery({ queryKey: qk.jobs(companyId), queryFn: () => fetchJobs(companyId) });
  const applications = useQuery({
    queryKey: qk.companyApplications(companyId),
    queryFn: () => fetchCompanyApplications(companyId),
  });
  const hiredAi = useQuery({ queryKey: qk.hiredAi(companyId), queryFn: () => fetchHiredAi(companyId) });

  const openJobs = (jobs.data ?? []).filter((job) => job.status === "open").length;
  const pending = (applications.data ?? []).filter((item) => item.status === "pending");
  const monthlyAiCost = (hiredAi.data ?? []).reduce(
    (sum, item) => sum + (item.ai_employee?.monthly_price ?? 0),
    0,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team" value={(team.data ?? []).length + 1} hint="Including you as Director" icon={Users} />
        <StatCard label="Open jobs" value={openJobs} hint={`${(jobs.data ?? []).length} total`} icon={Briefcase} />
        <StatCard label="Applications" value={pending.length} hint="Awaiting your decision" icon={ClipboardList} />
        <StatCard
          label="AI employees"
          value={(hiredAi.data ?? []).length}
          hint={`$${monthlyAiCost}/mo simulated`}
          icon={Bot}
        />
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/jobs">Create job</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/applications">View applications</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/ai-employees">Hire AI employee</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/office">Enter office</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Latest applications</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/applications">All</Link>
            </Button>
          </div>
          {applications.isLoading ? <LoadingRow /> : null}
          {!applications.isLoading && (applications.data ?? []).length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No applications yet. Post a job to start receiving candidates.
            </p>
          ) : null}
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {(applications.data ?? []).slice(0, 5).map((application) => (
              <li key={application.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {application.developer?.full_name ?? "Developer"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {application.job?.title} · {formatDate(application.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {application.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Active projects</h2>
            <Badge variant="outline">Coming soon</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Project tracking for {companyName} is not part of the MVP yet. Your team, jobs and AI
            employees are fully functional today.
          </p>
        </section>
      </div>
    </>
  );
}

function DeveloperDashboard({ developerId }: { developerId: string | null }) {
  const applications = useQuery({
    queryKey: qk.developerApplications(developerId ?? "none"),
    queryFn: () => fetchDeveloperApplications(developerId!),
    enabled: Boolean(developerId),
  });
  const { developerProfile, memberships } = useWorkspace();

  if (!developerId) {
    return (
      <EmptyState
        title="Create your developer profile"
        description="Add your headline, skills, experience and CV so Directors can find and hire you."
        action={
          <Button asChild>
            <Link to="/developer">Create profile</Link>
          </Button>
        }
        icon={<FileText className="size-6" />}
      />
    );
  }

  const accepted = (applications.data ?? []).filter((item) => item.status === "accepted").length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={(applications.data ?? []).length} icon={ClipboardList} />
        <StatCard label="Accepted" value={accepted} hint="Offers you joined" icon={Rocket} />
        <StatCard label="Companies" value={memberships.length} hint="Teams you belong to" icon={Users} />
        <StatCard
          label="CV"
          value={developerProfile?.cv_path ? "Uploaded" : "Missing"}
          hint={developerProfile?.cv_path ? "Visible to Directors" : "Upload a PDF"}
          icon={FileText}
        />
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/developer">Edit profile & CV</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/companies">Browse companies</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/office">Enter office</Link>
          </Button>
        </div>
      </div>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Your applications</h2>
          <Button asChild size="sm" variant="ghost">
            <Link to="/applications">All</Link>
          </Button>
        </div>
        {applications.isLoading ? <LoadingRow /> : null}
        {!applications.isLoading && (applications.data ?? []).length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            You have not applied to any jobs yet.
          </p>
        ) : null}
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {(applications.data ?? []).slice(0, 5).map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {application.job?.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {application.company?.name} · {formatDate(application.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {application.status}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function DashboardPage() {
  const { profile } = useAuth();
  const { isDirector, company, developerId, loading } = useWorkspace();

  return (
    <>
      <PageHeader
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description={
          isDirector
            ? company
              ? `${company.name} · ${company.industry || "Company"}${company.location ? ` · ${company.location}` : ""}`
              : "Create your company to unlock jobs, applications, team and AI employees."
            : "Track your profile, applications and the teams you have joined."
        }
        actions={
          isDirector && !company ? (
            <Button asChild>
              <Link to="/company">Create company</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/office">
                <Monitor className="mr-2 size-4" /> Virtual office
              </Link>
            </Button>
          )
        }
      />

      {loading ? <LoadingRow label="Loading your workspace" /> : null}

      {!loading && isDirector && !company ? (
        <EmptyState
          title="No company yet"
          description="A Director runs COVENL from a company. Create yours to post jobs, hire developers and add AI employees."
          action={
            <Button asChild>
              <Link to="/company">Create your company</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && isDirector && company ? (
        <DirectorDashboard companyId={company.id} companyName={company.name} />
      ) : null}

      {!loading && !isDirector ? <DeveloperDashboard developerId={developerId} /> : null}
    </>
  );
}
