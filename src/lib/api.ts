import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type Company = Tables["companies"]["Row"];
export type DeveloperProfile = Tables["developer_profiles"]["Row"];
export type Job = Tables["jobs"]["Row"];
export type Application = Tables["applications"]["Row"];
export type TeamMember = Tables["team_members"]["Row"];
export type AiEmployee = Tables["ai_employees"]["Row"];
export type HiredAiEmployee = Tables["hired_ai_employees"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export type JobWithCompany = Job & { company: Pick<Company, "id" | "name" | "logo_url" | "location" | "industry"> | null };
export type ApplicationRow = Application & {
  job: Pick<Job, "id" | "title" | "employment_type"> | null;
  company: Pick<Company, "id" | "name" | "logo_url"> | null;
  developer: DeveloperProfile | null;
};
export type TeamMemberRow = TeamMember & { developer: DeveloperProfile | null };
export type HiredAiRow = HiredAiEmployee & { ai_employee: AiEmployee | null };

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const qk = {
  profile: (userId: string) => ["profile", userId] as const,
  myCompany: (userId: string) => ["my-company", userId] as const,
  companies: () => ["companies"] as const,
  company: (id: string) => ["company", id] as const,
  jobs: (companyId?: string) => ["jobs", companyId ?? "all"] as const,
  myDeveloperProfile: (userId: string) => ["my-developer-profile", userId] as const,
  developers: () => ["developers"] as const,
  developer: (id: string) => ["developer", id] as const,
  companyApplications: (companyId: string) => ["applications", "company", companyId] as const,
  developerApplications: (devId: string) => ["applications", "developer", devId] as const,
  team: (companyId: string) => ["team", companyId] as const,
  hiredAi: (companyId: string) => ["hired-ai", companyId] as const,
  aiEmployees: () => ["ai-employees"] as const,
  aiEmployee: (id: string) => ["ai-employee", id] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  developerMemberships: (devId: string) => ["memberships", devId] as const,
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  return unwrap(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle());
}

export async function fetchMyCompany(userId: string): Promise<Company | null> {
  return unwrap(
    await supabase.from("companies").select("*").eq("owner_id", userId).order("created_at").limit(1).maybeSingle(),
  );
}

export async function fetchCompanies(): Promise<Company[]> {
  return unwrap(await supabase.from("companies").select("*").order("created_at", { ascending: false }));
}

export async function fetchCompany(id: string): Promise<Company | null> {
  return unwrap(await supabase.from("companies").select("*").eq("id", id).maybeSingle());
}

export async function fetchJobs(companyId?: string) {
  let query = supabase
    .from("jobs")
    .select("*, company:companies(id, name, logo_url, location, industry)")
    .order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  return unwrap(await query) as unknown as JobWithCompany[];
}

export async function fetchMyDeveloperProfile(userId: string): Promise<DeveloperProfile | null> {
  return unwrap(await supabase.from("developer_profiles").select("*").eq("user_id", userId).maybeSingle());
}

export async function fetchDevelopers(): Promise<DeveloperProfile[]> {
  return unwrap(await supabase.from("developer_profiles").select("*").order("created_at", { ascending: false }));
}

export async function fetchDeveloper(id: string): Promise<DeveloperProfile | null> {
  return unwrap(await supabase.from("developer_profiles").select("*").eq("id", id).maybeSingle());
}

const applicationSelect =
  "*, job:jobs(id, title, employment_type), company:companies(id, name, logo_url), developer:developer_profiles(*)";

export async function fetchCompanyApplications(companyId: string) {
  return unwrap(
    await supabase
      .from("applications")
      .select(applicationSelect)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ) as unknown as ApplicationRow[];
}

export async function fetchDeveloperApplications(developerId: string) {
  return unwrap(
    await supabase
      .from("applications")
      .select(applicationSelect)
      .eq("developer_id", developerId)
      .order("created_at", { ascending: false }),
  ) as unknown as ApplicationRow[];
}

export async function fetchTeam(companyId: string) {
  return unwrap(
    await supabase
      .from("team_members")
      .select("*, developer:developer_profiles(*)")
      .eq("company_id", companyId)
      .order("joined_at"),
  ) as unknown as TeamMemberRow[];
}

export async function fetchDeveloperMemberships(developerId: string) {
  return unwrap(
    await supabase
      .from("team_members")
      .select("*, company:companies(id, name, logo_url, industry, location)")
      .eq("developer_id", developerId),
  ) as unknown as (TeamMember & { company: Company | null })[];
}

export async function fetchHiredAi(companyId: string) {
  return unwrap(
    await supabase
      .from("hired_ai_employees")
      .select("*, ai_employee:ai_employees(*)")
      .eq("company_id", companyId)
      .order("hired_at"),
  ) as unknown as HiredAiRow[];
}

export async function fetchAiEmployees(): Promise<AiEmployee[]> {
  return unwrap(await supabase.from("ai_employees").select("*").order("monthly_price"));
}

export async function fetchAiEmployee(id: string): Promise<AiEmployee | null> {
  return unwrap(await supabase.from("ai_employees").select("*").eq("id", id).maybeSingle());
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  return unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  );
}
