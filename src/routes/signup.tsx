import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { LogoWordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign up — COVENL" },
      {
        name: "description",
        content: "Create a COVENL account as a Director to build a company, or as a Developer to get hired.",
      },
      { property: "og:title", content: "Sign up — COVENL" },
      { property: "og:description", content: "Join COVENL as a Director or a Developer." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  role: z.enum(["director", "developer"]),
});

const roles: { value: AppRole; title: string; body: string }[] = [
  { value: "director", title: "Director", body: "Create a company, post jobs and hire your team." },
  { value: "developer", title: "Developer", body: "Build a profile, upload your CV and apply to jobs." },
];

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("director");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ fullName, email, password, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName, role: parsed.data.role },
      },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — welcome to COVENL");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Check your inbox to confirm your email, then log in.");
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="hero-aura flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex">
          <LogoWordmark subtitle="Build your company" />
        </Link>
        <div className="panel p-7">
          <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose how you want to work on COVENL.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-medium text-foreground">I am a</legend>
              {roles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    role === option.value
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.body}</span>
                </button>
              ))}
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                maxLength={80}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
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
                autoComplete="new-password"
                value={password}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
