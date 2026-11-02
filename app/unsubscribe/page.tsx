import { Suspense } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { verifyUnsubscribeToken } from "@/lib/services/unsubscribe";
import { createAdminClient } from "@/lib/supabase/server";

interface UnsubscribePageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm text-center">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Vérification…</p>}>
          <UnsubscribeContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function UnsubscribeContent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <div className="space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">
          Les informations de désinscription fournies sont incomplètes ou expirées.
        </p>
      </div>
    );
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return (
      <div className="space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Jeton non reconnu</h1>
        <p className="text-sm text-muted-foreground">
          Ce lien de désinscription n&apos;est pas valide pour l&apos;adresse {email}.
        </p>
      </div>
    );
  }

  // Enregistrement dans suppression_list (RGPD)
  const supabase = createAdminClient();
  await supabase
    .from("suppression_list")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        reason: "user_unsubscribe",
      },
      { onConflict: "email" },
    );

  return (
    <div className="space-y-4">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">Désinscription confirmée</h1>
      <p className="text-sm text-muted-foreground">
        L&apos;adresse <strong>{email}</strong> a été définitivement ajoutée à notre liste d&apos;exclusion.
        Vous ne recevrez plus aucune communication de notre part.
      </p>
    </div>
  );
}
