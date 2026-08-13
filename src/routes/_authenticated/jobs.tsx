import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { JobCard } from "@/components/cards/JobCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingCards } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { fetchDeveloperApplications, fetchJobs, qk, type JobWithCompany } from "@/lib/api";
import { parseSkills } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/jobs")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" && search.q.length ? search.q.slice(0, 80) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Jobs — COVENL" },
      { name: "description", content: "Browse open roles across COVENL companies, or post a new job for your company." },
      { property: "og:title", content: "Jobs — COVENL" },
      { property: "og:description", content: "Open roles across COVENL companies." },
    ],
  }),
  component: JobsPage,
});

const jobSchema = z.object({
  title: z.string().trim().min(2, "Job title is required").max(80),
  description: z.string().trim().max(2000),
  employment_type: z.string().trim().min(2).max(40),
  skills: z.array(z.string().max(40)).max(24),
});

function CreateJobDialog({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    employment_type: "Full-time",
    skills: "",
  });
  const [error, setError] = useState<string | null>(null);

  const createJob = useMutation({
    mutationFn: async () => {
      const parsed = jobSchema.safeParse({ ...form, skills: parseSkills(form.skills) });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const { error: insertError } = await supabase
        .from("jobs")
        .insert({ ...parsed.data, company_id: companyId });
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job published");
      setForm({ title: "", description: "", employment_type: "Full-time", skills: "" });
      setOpen(false);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Create job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a job</DialogTitle>
          <DialogDescription>
            Published jobs are visible to every developer on COVENL.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            createJob.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              maxLength={80}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="employment_type">Employment type</Label>
            <Input
              id="employment_type"
              value={form.employment_type}
              maxLength={40}
              onChange={(event) => setForm({ ...form, employment_type: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="skills">Required skills (comma separated)</Label>
            <Input
              id="skills"
              value={form.skills}
              placeholder="React, TypeScript, Next.js"
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? "Publishing…" : "Publish job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApplyDialog({
  job,
  developerId,
  alreadyApplied,
}: {
  job: JobWithCompany;
  developerId: string | null;
  alreadyApplied: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = useMutation({
    mutationFn: async () => {
      const { error: insertError } = await supabase.from("applications").insert({
        job_id: job.id,
        company_id: job.company_id,
        developer_id: developerId!,
        cover_note: note.trim().slice(0, 1000),
      });
      if (insertError) {
        throw new Error(
          insertError.code === "23505"
            ? "You have already applied to this job."
            : insertError.message,
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application sent");
      setOpen(false);
      setNote("");
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  if (!developerId) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/developer">Create profile to apply</Link>
      </Button>
    );
  }

  if (alreadyApplied) {
    return (
      <Button size="sm" variant="outline" disabled>
        Already applied
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Apply</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply — {job.title}</DialogTitle>
          <DialogDescription>
            Your profile, skills and CV are shared with {job.company?.name ?? "the company"}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            apply.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Message to the Director (optional)</Label>
            <Textarea
              id="note"
              rows={4}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={apply.isPending}>
              {apply.isPending ? "Sending…" : "Send application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobsPage() {
  const { q } = Route.useSearch();
  const { isDirector, company, developerId } = useWorkspace();
  const [onlyMine, setOnlyMine] = useState(false);

  const jobs = useQuery({ queryKey: qk.jobs(), queryFn: () => fetchJobs() });
  const myApplications = useQuery({
    queryKey: qk.developerApplications(developerId ?? "none"),
    queryFn: () => fetchDeveloperApplications(developerId!),
    enabled: Boolean(developerId),
  });

  const appliedJobIds = new Set((myApplications.data ?? []).map((item) => item.job_id));
  const needle = (q ?? "").toLowerCase();
  const filtered = (jobs.data ?? [])
    .filter((job) => (onlyMine && company ? job.company_id === company.id : true))
    .filter((job) =>
      needle
        ? job.title.toLowerCase().includes(needle) ||
          job.skills.some((skill) => skill.toLowerCase().includes(needle)) ||
          (job.company?.name ?? "").toLowerCase().includes(needle)
        : true,
    );

  return (
    <>
      <PageHeader
        title="Jobs"
        description={
          q ? `Results for “${q}”` : "Open roles published by companies across COVENL."
        }
        actions={
          <>
            {company && isDirector ? (
              <Button variant="outline" size="sm" onClick={() => setOnlyMine((value) => !value)}>
                {onlyMine ? "All jobs" : "Only my company"}
              </Button>
            ) : null}
            {isDirector && company ? <CreateJobDialog companyId={company.id} /> : null}
          </>
        }
      />

      {jobs.isLoading ? <LoadingCards /> : null}
      {jobs.isError ? (
        <ErrorState message={(jobs.error as Error).message} onRetry={() => jobs.refetch()} />
      ) : null}

      {!jobs.isLoading && filtered.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description={
            isDirector
              ? "Publish your first job so developers can apply to your company."
              : "No open roles match your search yet. Try a different skill or keyword."
          }
          icon={<Briefcase className="size-6" />}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            actions={
              isDirector ? (
                company && job.company_id === company.id ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/applications">View applications</Link>
                  </Button>
                ) : null
              ) : (
                <ApplyDialog
                  job={job}
                  developerId={developerId}
                  alreadyApplied={appliedJobIds.has(job.id)}
                />
              )
            }
          />
        ))}
      </div>
    </>
  );
}
