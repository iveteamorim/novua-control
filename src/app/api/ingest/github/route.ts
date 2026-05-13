import { NextResponse } from "next/server";

import { normalizeGitHubWebhook } from "@/lib/control/ingestion";

export async function GET() {
  return NextResponse.json({
    source: "github",
    message:
      "POST a GitHub webhook payload here to preview normalized artifacts, events, and signals.",
    acceptedEvents: ["pull_request", "pull_request_review", "check_run"],
  });
}

export async function POST(request: Request) {
  const eventType =
    request.headers.get("x-github-event") ??
    new URL(request.url).searchParams.get("event") ??
    "pull_request";

  const payload = (await request.json()) as unknown;
  const preview = normalizeGitHubWebhook(payload, eventType);

  return NextResponse.json(preview);
}
