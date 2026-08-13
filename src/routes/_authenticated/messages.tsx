import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/PageHeader";
import { ComingSoon } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — COVENL" },
      { name: "description", content: "Team messaging inside COVENL — planned for a release after the MVP." },
      { property: "og:title", content: "Messages — COVENL" },
      { property: "og:description", content: "Team messaging inside COVENL." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Messages" description="Direct messaging between your team members." />
      <ComingSoon feature="Messages" />
    </>
  ),
});
