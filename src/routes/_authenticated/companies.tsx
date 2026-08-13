import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";

import { CompanyLogo } from "@/components/company/CompanyLogo";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingCards } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { fetchCompanies, fetchJobs, qk } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({
    meta: [
      { title: "Companies — COVENL" },
      { name: "description", content: "Browse companies hiring on COVENL, their industry, location and open roles." },
      { property: "og:title", content: "Companies — COVENL" },
      { property: "og:description", content: "Companies hiring on COVENL." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const companies = useQuery({ queryKey: qk.companies(), queryFn: fetchCompanies });
  const jobs = useQuery({ queryKey: qk.jobs(), queryFn: () => fetchJobs() });

  return (
    <>
      <PageHeader title="Companies" description="Virtual companies built on COVENL." />

      {companies.isLoading ? <LoadingCards /> : null}
      {companies.isError ? (
        <ErrorState message={(companies.error as Error).message} onRetry={() => companies.refetch()} />
      ) : null}
      {!companies.isLoading && (companies.data ?? []).length === 0 ? (
        <EmptyState title="No companies yet" icon={<Building2 className="size-6" />} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(companies.data ?? []).map((company) => {
          const openJobs = (jobs.data ?? []).filter(
            (job) => job.company_id === company.id && job.status === "open",
          ).length;
          return (
            <article key={company.id} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <CompanyLogo company={company} size={44} />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {company.name}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.industry || "Industry not set"}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {company.description || "No description yet."}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {company.location || "Remote"}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground">{openJobs} open roles</span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/jobs" search={{ q: company.name }}>
                    View jobs
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
