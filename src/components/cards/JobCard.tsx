import { Briefcase, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { SkillList } from "@/components/common/SkillList";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { JobWithCompany } from "@/lib/api";

export function JobCard({ job, actions }: { job: JobWithCompany; actions?: ReactNode }) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="size-3" /> {job.employment_type}
            </span>
            {job.company ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" /> {job.company.name}
                {job.company.location ? ` · ${job.company.location}` : ""}
              </span>
            ) : null}
            <span>Posted {formatDate(job.created_at)}</span>
          </p>
        </div>
        <Badge variant={job.status === "open" ? "default" : "outline"} className="capitalize">
          {job.status}
        </Badge>
      </div>

      {job.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Required skills
        </p>
        <SkillList skills={job.skills} />
      </div>

      {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
    </article>
  );
}
