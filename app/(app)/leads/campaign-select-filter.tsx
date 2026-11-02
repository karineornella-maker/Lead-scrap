"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface CampaignSelectFilterProps {
  campaigns: { id: string; name: string }[];
  defaultValue: string;
  selectClass: string;
}

export function CampaignSelectFilter({
  campaigns,
  defaultValue,
  selectClass,
}: CampaignSelectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCampaign = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (nextCampaign) {
      params.set("campaign", nextCampaign);
    } else {
      params.delete("campaign");
    }

    router.push(`/leads?${params.toString()}`);
  };

  return (
    <select
      id="f-campaign"
      name="campaign"
      value={defaultValue}
      onChange={handleChange}
      className={selectClass}
    >
      <option value="">Toutes les campagnes</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

