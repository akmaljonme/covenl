import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileText } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SkillList } from "@/components/common/SkillList";
import { EmptyState, ErrorState, LoadingCards } from "@/components/common/States";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCompanyApplications,
  fetchDeveloperApplications,
  qk,
  type ApplicationRow,
  type ApplicationStatus,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { openCv } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Applications — COVENL" },
      { name: "description", content: "Review developer applications, view CVs and accept or reject candidates." },
      { property: "og:title", content: "Applications — COVENL" },
      { property: "og:description", content: "Review and decide on COVENL applications." },
    ],
  }),
  component: ApplicationsPage,
});

function statusVariant(status: ApplicationStatus) {
  if (status === "accepted") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

function DecisionButtons({ application }: { application: ApplicationRow }) {
  const queryClient = useQueryClient();

  const decide = useMutation({
    mutationFn: async (status: ApplicationStatus) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", application.id);
      if (error) throw new Error(error.message);
      return status;
    },
    onSuccess: async (status) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(
        status === "accepted"
          ? `${application.developer?.full_name ?? "Developer"} joined your team`
          : "Application rejected",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (application.status !== "pending") {
    return (
      <Badge variant={statusVariant(application.status)} className="capitalize">
        {application.status}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={decide.isPending}>
            Accept
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {application.developer?.full_name ?? "This developer"} will immediately join your
              company team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => decide.mutate("accepted")}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={decide.isPending}>
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this application?</AlertDialogTitle>
            <AlertDialogDescription>
              The developer will be notified that they were not accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => decide.mutate("rejected")}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ApplicationsPage() {
  const { isDirector, company, developerId } = useWorkspace();

  const directorApplications = useQuery({
    queryKey: qk.companyApplications(company?.id ?? "none"),
    queryFn: () => fetchCompanyApplications(company!.id),
    enabled: isDirector && Boolean(company?.id),
  });

  const developerApplications = useQuery({
    queryKey: qk.developerApplications(developerId ?? "none"),
    queryFn: () => fetchDeveloperApplications(developerId!),
    enabled: !isDirector && Boolean(developerId),
  });

  const query = isDirector ? directorApplications : developerApplications;
  const rows = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Applications"
        description={
          isDirector
            ? "Review candidates, open their CV and decide who joins your team."
            : "Track the status of every job you have applied to."
        }
      />

      {isDirector && !company ? (
        <EmptyState
          title="Create your company first"
          description="Applications arrive once your company has published a job."
          action={
            <Button asChild>
              <Link to="/company">Create company</Link>
            </Button>
          }
        />
      ) : null}

      {!isDirector && !developerId ? (
        <EmptyState
          title="Create your developer profile"
          description="You need a profile before you can apply to jobs."
          action={
            <Button asChild>
              <Link to="/developer">Create profile</Link>
            </Button>
          }
        />
      ) : null}

      {query.isLoading ? <LoadingCards /> : null}
      {query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : null}

      {!query.isLoading && (isDirector ? Boolean(company) : Boolean(developerId)) && rows.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description={
            isDirector
              ? "Publish a job and share it — applications will land here."
              : "Browse jobs and send your first application."
          }
          icon={<ClipboardList className="size-6" />}
          action={
            <Button asChild>
              <Link to="/jobs">{isDirector ? "Create a job" : "Browse jobs"}</Link>
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-col gap-4">
        {rows.map((application) => (
          <article key={application.id} className="panel flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isDirector
                    ? (application.developer?.full_name ?? "Developer")
                    : (application.job?.title ?? "Job")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isDirector
                    ? `${application.developer?.headline || "Developer"} · applied to ${application.job?.title}`
                    : `${application.company?.name ?? "Company"} · ${application.job?.employment_type ?? ""}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied {formatDate(application.created_at)}
                </p>
              </div>
              {isDirector ? (
                <DecisionButtons application={application} />
              ) : (
                <Badge variant={statusVariant(application.status)} className="capitalize">
                  {application.status}
                </Badge>
              )}
            </div>

            {application.cover_note ? (
              <p className="rounded-lg border border-border bg-accent/40 p-3 text-sm text-muted-foreground">
                {application.cover_note}
              </p>
            ) : null}

            {isDirector && application.developer ? (
              <>
                <SkillList skills={application.developer.skills} max={8} />
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/developers/$developerId"
                      params={{ developerId: application.developer.id }}
                    >
                      View profile
                    </Link>
                  </Button>
                  {application.developer.cv_path ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openCv(application.developer!.cv_path!).catch((error: Error) =>
                          toast.error(error.message),
                        )
                      }
                    >
                      <FileText className="mr-2 size-4" /> View CV
                    </Button>
                  ) : (
                    <Badge variant="outline">No CV uploaded</Badge>
                  )}
                </div>
              </>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
