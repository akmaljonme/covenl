import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { LoadingRow } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/api";
import { parseSkills } from "@/lib/format";
import { openCv, uploadCv } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({
    meta: [
      { title: "My developer profile — COVENL" },
      { name: "description", content: "Build your COVENL developer profile: headline, bio, skills, experience, links and PDF CV." },
      { property: "og:title", content: "My developer profile — COVENL" },
      { property: "og:description", content: "Build your COVENL developer profile and upload your CV." },
    ],
  }),
  component: DeveloperProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(80),
  headline: z.string().trim().max(100),
  bio: z.string().trim().max(1500),
  experience_years: z.number().int().min(0).max(60),
  github_url: z.string().trim().max(200).url("GitHub must be a valid URL").or(z.literal("")),
  linkedin_url: z.string().trim().max(200).url("LinkedIn must be a valid URL").or(z.literal("")),
  skills: z.array(z.string().max(40)).max(24),
});

function DeveloperProfilePage() {
  const { user, profile } = useAuth();
  const { developerProfile, loading } = useWorkspace();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    bio: "",
    experience_years: "0",
    github_url: "",
    linkedin_url: "",
    skills: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (developerProfile) {
      setForm({
        full_name: developerProfile.full_name,
        headline: developerProfile.headline,
        bio: developerProfile.bio,
        experience_years: String(developerProfile.experience_years),
        github_url: developerProfile.github_url ?? "",
        linkedin_url: developerProfile.linkedin_url ?? "",
        skills: developerProfile.skills.join(", "),
      });
    } else if (profile?.full_name) {
      setForm((current) => ({ ...current, full_name: profile.full_name }));
    }
  }, [developerProfile, profile?.full_name]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        full_name: form.full_name,
        headline: form.headline,
        bio: form.bio,
        experience_years: Number(form.experience_years) || 0,
        github_url: form.github_url.trim(),
        linkedin_url: form.linkedin_url.trim(),
        skills: parseSkills(form.skills),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const payload = {
        ...parsed.data,
        github_url: parsed.data.github_url || null,
        linkedin_url: parsed.data.linkedin_url || null,
        user_id: user!.id,
      };
      const { error: writeError } = developerProfile
        ? await supabase.from("developer_profiles").update(payload).eq("id", developerProfile.id)
        : await supabase.from("developer_profiles").insert(payload);
      if (writeError) throw new Error(writeError.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.myDeveloperProfile(user!.id) });
      await queryClient.invalidateQueries({ queryKey: qk.developers() });
      toast.success("Profile saved");
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  async function onCvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!developerProfile) {
      toast.error("Save your profile first, then upload your CV.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const { path } = await uploadCv(user!.id, file);
      const { error: updateError } = await supabase
        .from("developer_profiles")
        .update({ cv_path: path })
        .eq("id", developerProfile.id);
      if (updateError) throw new Error(updateError.message);
      await queryClient.invalidateQueries({ queryKey: qk.myDeveloperProfile(user!.id) });
      toast.success("CV uploaded");
    } catch (uploadError) {
      toast.error((uploadError as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) return <LoadingRow label="Loading your profile" />;

  return (
    <>
      <PageHeader
        title={developerProfile ? "My developer profile" : "Create your developer profile"}
        description="Directors see this profile, your skills and your CV when you apply to their jobs."
      />

      <div className="panel flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">CV (PDF)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF only, up to 5 MB. Shared with Directors you apply to.
            </p>
          </div>
          {developerProfile?.cv_path ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openCv(developerProfile.cv_path!).catch((cvError: Error) =>
                  toast.error(cvError.message),
                )
              }
            >
              <FileText className="mr-2 size-4" /> View CV
            </Button>
          ) : (
            <Badge variant="outline">Not uploaded</Badge>
          )}
        </div>
        <Input
          type="file"
          accept="application/pdf"
          className="max-w-xs"
          onChange={onCvChange}
          disabled={uploading}
        />
      </div>

      <form
        className="panel flex flex-col gap-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              maxLength={80}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={form.headline}
              maxLength={100}
              placeholder="Full Stack Developer"
              onChange={(event) => setForm({ ...form, headline: event.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            maxLength={1500}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <Input
              id="skills"
              value={form.skills}
              placeholder="React, TypeScript, Node.js"
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="experience_years">Years of experience</Label>
            <Input
              id="experience_years"
              type="number"
              min={0}
              max={60}
              value={form.experience_years}
              onChange={(event) => setForm({ ...form, experience_years: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="github_url">GitHub</Label>
            <Input
              id="github_url"
              value={form.github_url}
              maxLength={200}
              placeholder="https://github.com/username"
              onChange={(event) => setForm({ ...form, github_url: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              value={form.linkedin_url}
              maxLength={200}
              placeholder="https://linkedin.com/in/username"
              onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={save.isPending} className="self-start">
          {save.isPending ? "Saving…" : developerProfile ? "Save profile" : "Create profile"}
        </Button>
      </form>
    </>
  );
}
