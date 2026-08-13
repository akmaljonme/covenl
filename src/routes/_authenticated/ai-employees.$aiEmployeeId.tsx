import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SkillList } from "@/components/common/SkillList";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { fetchAiEmployee, fetchHiredAi, qk } from "@/lib/api";
import { AI_LEVEL_PRICES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-employees/$aiEmployeeId")({
  head: () => ({
    meta: [
      { title: "AI employee — COVENL" },
      { name: "description", content: "AI employee details: level, monthly price, skills and what it does for your team." },
      { property: "og:title", content: "AI employee — COVENL" },
      { property: "og:description", content: "AI employee details on COVENL." },
    ],
  }),
  component: AiEmployeeDetailPage,
});

function AiEmployeeDetailPage() {
  const { aiEmployeeId } = Route.useParams();
  const { isDirector, company } = useWorkspace();
  const queryClient = useQueryClient();

  const employee = useQuery({
    queryKey: qk.aiEmployee(aiEmployeeId),
    queryFn: () => fetchAiEmployee(aiEmployeeId),
  });
  const hired = useQuery({
    queryKey: qk.hiredAi(company?.id ?? "none"),
    queryFn: () => fetchHiredAi(company!.id),
    enabled: Boolean(company?.id),
  });

  const alreadyHired = (hired.data ?? []).some((item) => item.ai_employee_id === aiEmployeeId);

  const hire = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("hired_ai_employees")
        .insert({ company_id: company!.id, ai_employee_id: aiEmployeeId });
      if (error) {
        throw new Error(
          error.code === "23505" ? "This AI employee is already on your team." : error.message,
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.hiredAi(company!.id) });
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("AI Employee successfully added to your company.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (employee.isLoading) return <LoadingRow label="Loading AI employee" />;
  if (!employee.data) {
    return <EmptyState title="AI employee not found" />;
  }

  const item = employee.data;

  return (
    <>
      <PageHeader
        title={item.name}
        description={item.role}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ai-employees">Back to marketplace</Link>
            </Button>
            {isDirector && company ? (
              alreadyHired ? (
                <Button disabled variant="outline">
                  Hired
                </Button>
              ) : (
                <Button onClick={() => hire.mutate()} disabled={hire.isPending}>
                  {hire.isPending ? "Hiring…" : "Hire"}
                </Button>
              )
            ) : null}
          </>
        }
      />

      <div className="panel flex flex-col gap-5 p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl border border-border bg-accent text-3xl">
            {item.avatar}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.level}</Badge>
              <Badge variant="outline">{item.category}</Badge>
            </div>
            <p className="mt-2 text-2xl font-semibold text-primary">${item.monthly_price}/month</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

        <div>
          <h2 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Skills
          </h2>
          <SkillList skills={item.skills} max={24} />
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Level progression
          </h2>
          <div className="grid gap-2 sm:grid-cols-4">
            {AI_LEVEL_PRICES.map((tier) => (
              <div
                key={tier.level}
                className={cn(
                  "rounded-lg border p-3",
                  tier.level === item.level ? "border-primary bg-accent" : "border-border",
                )}
              >
                <p className="text-sm font-medium text-foreground">{tier.level}</p>
                <p className="text-sm text-muted-foreground">${tier.price}/mo</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            MVP demo subscription — no real payment is processed and pricing is capped at $20/month.
          </p>
        </div>
      </div>
    </>
  );
}
