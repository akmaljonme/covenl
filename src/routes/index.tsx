import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Building2, Monitor, Users } from "lucide-react";

import { LogoWordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "COVENL — Build your company" },
      {
        name: "description",
        content:
          "COVENL is the virtual company platform: create a company, hire real developers, hire AI employees and run your whole team from one workspace.",
      },
      { property: "og:title", content: "COVENL — Build your company" },
      {
        property: "og:description",
        content:
          "Create a company, hire developers, hire AI employees and manage everyone from one virtual workspace.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Building2,
    title: "Create your company",
    body: "Register a company, define your industry and location, and run it as its Director.",
  },
  {
    icon: Users,
    title: "Hire real developers",
    body: "Post jobs, review CVs and applications, then accept candidates straight into your team.",
  },
  {
    icon: Bot,
    title: "Hire AI employees",
    body: "Add AI developers, designers, marketers and product managers from $5 to $20 a month.",
  },
  {
    icon: Monitor,
    title: "Run a virtual office",
    body: "See your Director, developers and AI employees at their desks with live status labels.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <LogoWordmark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="hero-aura border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
            The virtual company platform
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold text-foreground sm:text-6xl">
            BUILD YOUR COMPANY.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            COVENL gives you one workspace to found a company, hire real developers, hire AI
            employees and manage the whole team from a single virtual office.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Create your company</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signup">Join as a developer</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <article key={title} className="panel p-6">
            <span className="inline-flex rounded-lg border border-border bg-accent p-2.5 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <LogoWordmark size={26} />
          <p>MVP demo — AI employee subscriptions are simulated, no payments are processed.</p>
        </div>
      </footer>
    </div>
  );
}
