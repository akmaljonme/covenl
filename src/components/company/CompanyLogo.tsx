import { useQuery } from "@tanstack/react-query";

import { LogoMark } from "@/components/brand/Logo";
import { createSignedUrl } from "@/lib/storage";
import type { Company } from "@/lib/api";

export function CompanyLogo({
  company,
  size = 48,
}: {
  company: Pick<Company, "id" | "name" | "logo_url">;
  size?: number;
}) {
  const { data: signedUrl } = useQuery({
    queryKey: ["company-logo", company.id, company.logo_url],
    queryFn: () => createSignedUrl("company-logos", company.logo_url!),
    enabled: Boolean(company.logo_url),
    staleTime: 5 * 60 * 1000,
  });

  if (signedUrl) {
    return (
      <img
        src={signedUrl}
        alt={`${company.name} logo`}
        width={size}
        height={size}
        className="rounded-xl border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return <LogoMark size={size} />;
}
