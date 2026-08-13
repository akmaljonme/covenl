import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Github, Linkedin } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SkillList } from "@/components/common/SkillList";
import { EmptyState, LoadingRow } from "@/components/common/States";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchDeveloper, qk } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { openCv } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/developers/$developerId")({
  head: () => ({
    meta: [
      { title: "Developer profile — COVENL" },
      { name: "description", content: "A COVENL developer profile with skills, experience, links and CV." },
      { property: "og:title", content: "Developer profile — COVENL" },
      { property: "og:description", content: "Skills, experience and CV of a COVENL developer." },
    ],
  }),
  component: DeveloperDetailPage,
});

function DeveloperDetailPage() {
  const { developerId } = Route.useParams();
  const { isDirector } = useAuth();
  const developer = useQuery({
    queryKey: qk.developer(developerId),
    queryFn: () => fetchDeveloper(developerId),
  });

  if (developer.isLoading) return <LoadingRow label="Loading profile" />;
  if (!developer.data) {
    return <EmptyState title="Developer not found" description="This profile no longer exists." />;
  }

  const person = developer.data;

  return (
    <>
      <PageHeader
        title={person.full_name}
        description={person.headline || "Developer"}
        actions={
          isDirector ? (
            <Button asChild variant="outline">
              <Link to="/applications">Back to applications</Link>
            </Button>
          ) : null
        }
      />

      <div className="panel flex flex-col gap-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-secondary text-lg text-secondary-foreground">
              {getInitials(person.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{person.full_name}</h2>
            <p className="text-sm text-muted-foreground">{person.headline || "Developer"}</p>
            <Badge variant="outline" className="mt-2">
              {person.experience_years} {person.experience_years === 1 ? "year" : "years"} experience
            </Badge>
          </div>
        </div>

        {person.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
        ) : null}

        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Skills
          </h3>
          <SkillList skills={person.skills} max={24} />
        </div>

        <div className="flex flex-wrap gap-2">
          {person.cv_path ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCv(person.cv_path!).catch((error: Error) => toast.error(error.message))}
            >
              <FileText className="mr-2 size-4" /> View CV
            </Button>
          ) : (
            <Badge variant="outline">No CV uploaded</Badge>
          )}
          {person.github_url ? (
            <Button asChild variant="outline" size="sm">
              <a href={person.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 size-4" /> GitHub
              </a>
            </Button>
          ) : null}
          {person.linkedin_url ? (
            <Button asChild variant="outline" size="sm">
              <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2 size-4" /> LinkedIn
              </a>
            </Button>
          ) : null}
          {!isDirector ? (
            <Button asChild size="sm">
              <Link to="/jobs">Apply to a job</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
