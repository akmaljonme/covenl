export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseSkills(value: string) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export const AI_LEVEL_PRICES = [
  { level: "Beginner", price: 5 },
  { level: "Intermediate", price: 10 },
  { level: "Advanced", price: 15 },
  { level: "Expert", price: 20 },
] as const;
