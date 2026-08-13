import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, MapPin, Briefcase, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { fetchJobs, fetchTeam, qk } from "@/lib/api";
import { CompanyLogo } from "@/components/company/CompanyLogo";

export const Route = createFileRoute("/_authenticated/company/")({
  head: () => ({
    meta: [
      { title: "Company — COVENL" },
      { name: "description", content: "Create and review your COVENL company profile, team size and open jobs." },
      { property: "og:title", content: "Company — COVENL" },
      { property: "og:description", content: "Your COVENL company profile." },
    ],
  }),
  component: CompanyPage,
});

const companySchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(80),
  description: z.string().trim().max(1000).default(""),
  industry: z.string().trim().max(60).default(""),
  location: z.string().trim().max(80).default(""),
});

function CreateCompanyForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", industry: "", location: "" });
  const [error, setError] = useState<string | null>(null);

  const createCompany = useMutation({
    mutationFn: async () => {
      const parsed = companySchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const { data, error: insertError } = await supabase
        .from("companies")
        .insert({ ...parsed.data, owner_id: user!.id })
        .select("*")
        .single();
      if (insertError) throw new Error(insertError.message);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.myCompany(user!.id) });
      toast.success("Company created");
      navigate({ to: "/dashboard" });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  return (
    <form
      className="panel flex flex-col gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        createCompany.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Company name</Label>
        <Input
          id="name"
          value={form.name}
          maxLength={80}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={form.industry}
            maxLength={60}
            placeholder="Software, Fintech, AI…"
            onChange={(event) => setForm({ ...form, industry: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={form.location}
            maxLength={80}
            placeholder="Almaty, Kazakhstan"
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          maxLength={1000}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={createCompany.isPending}>
          {createCompany.isPending ? "Creating…" : "Create company"}
        </Button>
        <p className="self-center text-xs text-muted-foreground">
          You can upload a logo in company settings.
        </p>
      </div>
    </form>
  );
}

function CompanyPage() {
  const { isDirector, company, loading } = useWorkspace();
  const team = useQuery({
    queryKey: qk.team(company?.id ?? "none"),
    queryFn: () => fetchTeam(company!.id),
    enabled: Boolean(company?.id),
  });
  const jobs = useQuery({
    queryKey: qk.jobs(company?.id ?? "none"),
    queryFn: () => fetchJobs(company!.id),
    enabled: Boolean(company?.id),
  });

  if (loading) return <LoadingRow label="Loading company" />;

  if (!company) {
    return (
      <>
        <PageHeader
          title={isDirector ? "Create your company" : "Company"}
          description={
            isDirector
              ? "Your company is the home for jobs, applications, your team and AI employees."
              : "You are not part of a company yet. Apply to a job to join one."
          }
        />
        {isDirector ? (
          <CreateCompanyForm />
        ) : (
          <EmptyState
            title="No company yet"
            description="Once a Director accepts your application you will see their company here."
            action={
              <Button asChild>
                <Link to="/jobs">Browse jobs</Link>
              </Button>
            }
            icon={<Building2 className="size-6" />}
          />
        )}
      </>
    );
  }

  const openJobs = (jobs.data ?? []).filter((job) => job.status === "open").length;

  return (
    <>
      <PageHeader
        title={company.name}
        description={company.description || "No description yet."}
        actions={
          isDirector ? (
            <Button asChild variant="outline">
              <Link to="/company/settings">Company settings</Link>
            </Button>
          ) : null
        }
      />

      <div className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <CompanyLogo company={company} size={72} />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{company.name}</h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4" /> {company.industry || "Industry not set"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {company.location || "Location not set"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Team size"
          value={(team.data ?? []).length + 1}
          hint="Developers plus the Director"
          icon={Users}
        />
        <StatCard label="Open jobs" value={openJobs} icon={Briefcase} />
      </div>
    </>
  );
}
