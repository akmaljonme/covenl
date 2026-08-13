import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiEmployeeCard } from "@/components/cards/AiEmployeeCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingCards } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { fetchAiEmployees, fetchHiredAi, qk } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-employees/")({
  head: () => ({
    meta: [
      { title: "AI employees — COVENL" },
      { name: "description", content: "Hire AI developers, designers, marketers, researchers and product managers from $5 to $20 a month." },
      { property: "og:title", content: "AI employees — COVENL" },
      { property: "og:description", content: "The COVENL AI employee marketplace." },
    ],
  }),
  component: AiEmployeesPage,
});

const categories = ["All", "Developer", "Designer", "Marketing", "Researcher", "Product Manager"];

function AiEmployeesPage() {
  const { isDirector, company } = useWorkspace();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");

  const employees = useQuery({ queryKey: qk.aiEmployees(), queryFn: fetchAiEmployees });
  const hired = useQuery({
    queryKey: qk.hiredAi(company?.id ?? "none"),
    queryFn: () => fetchHiredAi(company!.id),
    enabled: Boolean(company?.id),
  });

  const hiredIds = new Set((hired.data ?? []).map((item) => item.ai_employee_id));

  const hire = useMutation({
    mutationFn: async (aiEmployeeId: string) => {
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

  const rows = (employees.data ?? []).filter((employee) =>
    category === "All" ? true : employee.category === category,
  );

  return (
    <>
      <PageHeader
        title="AI employees"
        description="Add AI teammates instantly. Subscriptions are simulated for this MVP — no payment is taken."
        actions={<Badge variant="outline">MVP demo subscription</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              category === item
                ? "border-primary bg-accent text-foreground"
                : "border-border text-muted-foreground hover:bg-accent/50",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {employees.isLoading ? <LoadingCards /> : null}
      {employees.isError ? (
        <ErrorState message={(employees.error as Error).message} onRetry={() => employees.refetch()} />
      ) : null}
      {!employees.isLoading && rows.length === 0 ? (
        <EmptyState title="No AI employees in this category" icon={<Bot className="size-6" />} />
      ) : null}

      {isDirector && !company ? (
        <EmptyState
          title="Create your company to hire"
          description="AI employees are hired into a company."
          action={
            <Button asChild>
              <Link to="/company">Create company</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((employee) => (
          <AiEmployeeCard
            key={employee.id}
            employee={employee}
            actions={
              isDirector && company ? (
                hiredIds.has(employee.id) ? (
                  <Button size="sm" variant="outline" disabled>
                    Hired
                  </Button>
                ) : (
                  <Button size="sm" disabled={hire.isPending} onClick={() => hire.mutate(employee.id)}>
                    {hire.isPending ? "Hiring…" : "Hire"}
                  </Button>
                )
              ) : null
            }
          />
        ))}
      </div>
    </>
  );
}
