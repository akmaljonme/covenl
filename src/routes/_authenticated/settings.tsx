import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — COVENL" },
      { name: "description", content: "Manage your COVENL account name, review your role and sign out." },
      { property: "og:title", content: "Settings — COVENL" },
      { property: "og:description", content: "Manage your COVENL account." },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({ full_name: z.string().trim().min(2, "Name is required").max(80) });

function SettingsPage() {
  const { user, profile, isDirector, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ full_name: fullName });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name })
        .eq("id", user!.id);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.profile(user!.id) });
      toast.success("Account updated");
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  return (
    <>
      <PageHeader title="Settings" description="Your COVENL account." />

      <form
        className="panel flex flex-col gap-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={fullName}
            maxLength={80}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} readOnly disabled />
        </div>
        <div className="flex items-center gap-2">
          <Label>Role</Label>
          <Badge variant="outline" className="capitalize">
            {profile?.role ?? "member"}
          </Badge>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link to={isDirector ? "/company/settings" : "/developer"}>
              {isDirector ? "Company settings" : "Developer profile"}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login", replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </form>
    </>
  );
}
