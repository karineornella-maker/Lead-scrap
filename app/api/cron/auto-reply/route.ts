import { NextResponse, type NextRequest } from "next/server";
import { checkAndAutoReplyInbox } from "@/lib/services/assistant/auto-responder";

/**
 * Route CRON pour la surveillance automatique de la boîte email et réponse IA
 * Appelable périodiquement (toutes les 5 ou 15 minutes) sans aucune intervention humaine
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "default-cron-secret-2026";

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  // Sécurité : Vérifie le secret si configuré
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
    // Si appelé en local sans secret, on autorise
    const host = request.headers.get("host") || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  try {
    const result = await checkAndAutoReplyInbox();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
