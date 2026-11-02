import { NextResponse, type NextRequest } from "next/server";
import { importRun } from "@/lib/services/import-leads";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const campaignId = searchParams.get("campaignId");

  const expectedSecret = process.env.APIFY_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new NextResponse("Secret invalide", { status: 401 });
  }

  if (!campaignId) {
    return new NextResponse("Paramètre campaignId manquant", { status: 400 });
  }

  try {
    const body = await request.json();
    const runId = body?.eventData?.actorRunId || body?.resource?.id || body?.id;

    if (!runId) {
      return new NextResponse("runId introuvable dans le payload", { status: 400 });
    }

    const summary = await importRun(campaignId, runId);
    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erreur webhook Apify:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

