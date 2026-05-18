import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth/session";
import { getControlDataset } from "@/lib/control/repository";
import { applyManualIncidentAction } from "@/lib/control/store";

const allowedActions = new Set([
  "assign_backend_owner",
  "start_mitigation",
  "resolve_incident",
] as const);

type AllowedAction =
  | "assign_backend_owner"
  | "start_mitigation"
  | "resolve_incident";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getOptionalSession();

  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { action?: string; owner?: string; actor?: string }
    | null;

  const action = body?.action;

  if (!action || !allowedActions.has(action as AllowedAction)) {
    return NextResponse.json(
      {
        error:
          "Invalid action. Expected assign_backend_owner, start_mitigation, or resolve_incident.",
      },
      { status: 400 },
    );
  }

  const dataset = await getControlDataset(session.workspaceId);
  const result = await applyManualIncidentAction(dataset, {
    alertId: id,
    action: action as AllowedAction,
    actor: body?.actor ?? session.displayName,
    owner: body?.owner,
  }, session.workspaceId);

  revalidatePath("/");
  revalidatePath(`/alerts/${id}`);
  revalidatePath("/ingestion-preview");

  return NextResponse.json({
    ok: true,
    alertId: id,
    action,
    state: result.state,
    touchedArtifacts: result.touchedArtifacts,
  });
}
