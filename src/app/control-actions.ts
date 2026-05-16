"use server";

import { revalidatePath } from "next/cache";

import { getControlDataset } from "@/lib/control/repository";
import { applyManualIncidentAction } from "@/lib/control/store";

async function runIncidentAction(
  alertId: string,
  action: "assign_backend_owner" | "start_mitigation" | "resolve_incident",
) {
  const dataset = await getControlDataset();

  await applyManualIncidentAction(dataset, {
    alertId,
    action,
    actor: "Release Captain",
  });

  revalidatePath("/");
  revalidatePath(`/alerts/${alertId}`);
}

export async function assignBackendOwnerAction(alertId: string) {
  await runIncidentAction(alertId, "assign_backend_owner");
}

export async function startMitigationAction(alertId: string) {
  await runIncidentAction(alertId, "start_mitigation");
}

export async function resolveIncidentAction(alertId: string) {
  await runIncidentAction(alertId, "resolve_incident");
}
