import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "./campaign-form";

export const metadata = { title: "Nouvelle campagne · BRVM Leads" };

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader
        title="Nouvelle campagne"
        description="Définissez la zone, les universités, les réseaux et les métiers à cibler."
      />
      <CampaignForm />
    </>
  );
}
