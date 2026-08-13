import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ai-employees")({
  component: () => <Outlet />,
});
