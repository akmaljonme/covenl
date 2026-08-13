import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CompanyLogo } from "@/components/company/CompanyLogo";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/api";
import { uploadImage } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/company/settings")({
  head: () => ({
    meta: [
      { title: "Company settings — COVENL" },
      { name: "description", content: "Update your COVENL company name, logo, description, industry and location." },
      { property: "og:title", content: "Company settings — COVENL" },
      { property: "og:description", content: "Update your COVENL company profile." },
    ],
  }),
  component: CompanySettingsPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(80),
  description: z.string().trim().max(1000),
  industry: z.string().trim().max(60),
  location: z.string().trim().max(80),
});

function CompanySettingsPage() {
  const { user } = useAuth();
  const { company, isDirector, loading } = useWorkspace();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "", industry: "", location: "" });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        description: company.description,
        industry: company.industry,
        location: company.location,
      });
    }
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const { error: updateError } = await supabase
        .from("companies")
        .update(parsed.data)
        .eq("id", company!.id);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.myCompany(user!.id) });
      toast.success("Company updated");
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  async function onLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !company) return;
    setUploading(true);
    try {
      const { path } = await uploadImage("company-logos", user!.id, file);
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: path })
        .eq("id", company.id);
      if (updateError) throw new Error(updateError.message);
      await queryClient.invalidateQueries({ queryKey: qk.myCompany(user!.id) });
      toast.success("Logo updated");
    } catch (uploadError) {
      toast.error((uploadError as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) return <LoadingRow label="Loading company" />;
  if (!isDirector || !company) {
    return (
      <EmptyState
        title="No company to manage"
        description="Only the Director who owns a company can edit its settings."
      />
    );
  }

  return (
    <>
      <PageHeader title="Company settings" description="Update how your company appears across COVENL." />

      <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <CompanyLogo company={company} size={72} />
        <div>
          <Label htmlFor="logo" className="text-sm font-medium">
            Company logo
          </Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            className="mt-2 max-w-xs"
            onChange={onLogoChange}
            disabled={uploading}
          />
          <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
        </div>
      </div>

      <form
        className="panel flex flex-col gap-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          save.mutate();
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
              onChange={(event) => setForm({ ...form, industry: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              maxLength={80}
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
        <Button type="submit" disabled={save.isPending} className="self-start">
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </>
  );
}
