import { Badge } from "@/components/ui/badge";

export function SkillList({ skills, max = 8 }: { skills: string[]; max?: number }) {
  if (!skills.length) {
    return <p className="text-sm text-muted-foreground">No skills listed yet.</p>;
  }
  const visible = skills.slice(0, max);
  const rest = skills.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((skill) => (
        <Badge key={skill} variant="secondary" className="bg-accent text-accent-foreground">
          {skill}
        </Badge>
      ))}
      {rest > 0 ? <Badge variant="outline">+{rest}</Badge> : null}
    </div>
  );
}
