import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SkillList } from "@/components/common/SkillList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import type { DeveloperProfile } from "@/lib/api";

export function DeveloperCard({
  developer,
  actions,
}: {
  developer: DeveloperProfile;
  actions?: ReactNode;
}) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {getInitials(developer.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {developer.full_name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {developer.headline || "Developer"}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {developer.experience_years} {developer.experience_years === 1 ? "year" : "years"} of
        experience
      </p>

      <SkillList skills={developer.skills} max={5} />

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button asChild size="sm" variant="outline">
          <Link to="/developers/$developerId" params={{ developerId: developer.id }}>
            View profile
          </Link>
        </Button>
        {actions}
      </div>
    </article>
  );
}
