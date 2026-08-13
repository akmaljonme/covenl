import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { DeveloperCard } from "@/components/cards/DeveloperCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingCards } from "@/components/common/States";
import { Input } from "@/components/ui/input";
import { fetchDevelopers, qk } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/developers/")({
  head: () => ({
    meta: [
      { title: "Developers — COVENL" },
      { name: "description", content: "Browse developer profiles on COVENL by skill, headline and experience." },
      { property: "og:title", content: "Developers — COVENL" },
      { property: "og:description", content: "Browse developers available for hire on COVENL." },
    ],
  }),
  component: DevelopersPage,
});

function DevelopersPage() {
  const [term, setTerm] = useState("");
  const developers = useQuery({ queryKey: qk.developers(), queryFn: fetchDevelopers });

  const needle = term.toLowerCase();
  const rows = (developers.data ?? []).filter((developer) =>
    needle
      ? developer.full_name.toLowerCase().includes(needle) ||
        developer.headline.toLowerCase().includes(needle) ||
        developer.skills.some((skill) => skill.toLowerCase().includes(needle))
      : true,
  );

  return (
    <>
      <PageHeader
        title="Developers"
        description="Every developer profile published on COVENL."
        actions={
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter by name or skill"
            className="w-full sm:w-64"
            aria-label="Filter developers"
          />
        }
      />

      {developers.isLoading ? <LoadingCards /> : null}
      {developers.isError ? (
        <ErrorState
          message={(developers.error as Error).message}
          onRetry={() => developers.refetch()}
        />
      ) : null}
      {!developers.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No developers found"
          description="Try a different name or skill."
          icon={<UserRound className="size-6" />}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((developer) => (
          <DeveloperCard key={developer.id} developer={developer} />
        ))}
      </div>
    </>
  );
}
