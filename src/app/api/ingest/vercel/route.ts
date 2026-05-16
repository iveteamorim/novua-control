import { NextResponse } from "next/server";

import { controlDataset } from "@/lib/control/fixtures";
import { normalizeVercelWebhook } from "@/lib/control/ingestion";
import { persistIngestionPreview } from "@/lib/control/store";

export async function GET() {
  return NextResponse.json({
    source: "vercel",
    message:
      "POST a Vercel deployment webhook payload here to preview normalized artifacts, events, and signals.",
    acceptedEvents: ["deployment", "deployment.created", "deployment.error", "deployment.ready"],
  });
}

export async function POST(request: Request) {
  const eventType =
    request.headers.get("x-vercel-event") ??
    new URL(request.url).searchParams.get("event") ??
    "deployment";

  const payload = (await request.json()) as unknown;
  const preview = normalizeVercelWebhook(payload, eventType);
  const persistence = await persistIngestionPreview(preview, controlDataset);

  return NextResponse.json({
    ...preview,
    persistence,
  });
}
