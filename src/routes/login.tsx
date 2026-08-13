import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { LogoWordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Log in — COVENL" },
      { name: "description", content: "Log in to your COVENL workspace to manage your company, team and AI employees." },
      { property: "og:title", content: "Log in — COVENL" },
      { property: "og:description", content: "Log in to your COVENL workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    toast.success("Welcome back to COVENL");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="hero-aura flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex">
          <LogoWordmark subtitle="Build your company" />
        </Link>
        <div className="panel p-7">
          <h1 className="text-xl font-semibold text-foreground">Log in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Access your COVENL workspace.
          </p>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={255}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-5 text-sm text-muted-foreground">
            No account yet?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
