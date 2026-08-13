import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SkillList } from "@/components/common/SkillList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiEmployee } from "@/lib/api";

export function AiEmployeeCard({
  employee,
  actions,
}: {
  employee: AiEmployee;
  actions?: ReactNode;
}) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-accent text-xl">
            {employee.avatar}
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline">{employee.level}</Badge>
          <p className="mt-2 text-sm font-semibold text-primary">${employee.monthly_price}/mo</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{employee.description}</p>
      <SkillList skills={employee.skills} max={5} />

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button asChild size="sm" variant="outline">
          <Link to="/ai-employees/$aiEmployeeId" params={{ aiEmployeeId: employee.id }}>
            View
          </Link>
        </Button>
        {actions}
      </div>
    </article>
  );
}
