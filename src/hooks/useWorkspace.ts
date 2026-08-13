import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchDeveloperMemberships,
  fetchMyCompany,
  fetchMyDeveloperProfile,
  qk,
  type Company,
} from "@/lib/api";

/**
 * Resolves the workspace context for the signed-in user:
 * - a Director works inside the company they own
 * - a Developer works inside their own profile and the company that accepted them
 */
export function useWorkspace() {
  const { user, isDirector } = useAuth();
  const userId = user?.id ?? null;

  const developerProfileQuery = useQuery({
    queryKey: qk.myDeveloperProfile(userId ?? "anon"),
    queryFn: () => fetchMyDeveloperProfile(userId!),
    enabled: Boolean(userId),
  });

  const ownedCompanyQuery = useQuery({
    queryKey: qk.myCompany(userId ?? "anon"),
    queryFn: () => fetchMyCompany(userId!),
    enabled: Boolean(userId) && isDirector,
  });

  const developerId = developerProfileQuery.data?.id ?? null;

  const membershipsQuery = useQuery({
    queryKey: qk.developerMemberships(developerId ?? "none"),
    queryFn: () => fetchDeveloperMemberships(developerId!),
    enabled: Boolean(developerId) && !isDirector,
  });

  const memberships = membershipsQuery.data ?? [];
  const company: Company | null = isDirector
    ? (ownedCompanyQuery.data ?? null)
    : (memberships[0]?.company ?? null);

  return {
    isDirector,
    developerProfile: developerProfileQuery.data ?? null,
    developerId,
    company,
    memberships,
    loading:
      developerProfileQuery.isLoading ||
      (isDirector && ownedCompanyQuery.isLoading) ||
      (!isDirector && Boolean(developerId) && membershipsQuery.isLoading),
    error: developerProfileQuery.error ?? ownedCompanyQuery.error ?? membershipsQuery.error ?? null,
  };
}
