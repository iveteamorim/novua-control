import { controlDataset } from "../fixtures";
import { buildSeedSourceBundle, formatRelativeTime } from "../normalize";
import type { ControlArtifact, ControlEvent, SourceBundle } from "../types";

type VercelDeployment = {
  uid: string;
  name: string;
  readyState: string;
  target?: string | null;
  createdAt: number;
  meta?: Record<string, string | undefined>;
};

function isLiveVercelEnabled() {
  return Boolean(
    process.env.NOVUA_CONTROL_ENABLE_VERCEL_LIVE === "1" &&
      process.env.VERCEL_TOKEN &&
      process.env.NOVUA_CONTROL_VERCEL_PROJECT_ID,
  );
}

function mapVercelStatus(state: string): ControlArtifact["status"] {
  if (["ERROR", "CANCELED"].includes(state)) {
    return "failed";
  }

  if (["QUEUED", "BUILDING", "INITIALIZING"].includes(state)) {
    return "queued";
  }

  if (state === "READY") {
    return "healthy";
  }

  return "in_progress";
}

function mapDeploymentToArtifact(deployment: VercelDeployment): ControlArtifact {
  const status = mapVercelStatus(deployment.readyState);
  const service = deployment.name || "vercel-project";

  return {
    id: `live-vercel-deploy-${deployment.uid}`,
    label: `${service}-${deployment.target ?? "preview"}`,
    type: "deployment",
    source: "vercel",
    service,
    owner: deployment.meta?.githubCommitAuthorLogin ?? null,
    status,
    updatedAt: formatRelativeTime(deployment.createdAt),
    summary:
      status === "failed"
        ? "Deployment failed and should be reviewed before the next release move."
        : status === "queued"
          ? "Deployment is queued and waiting for the release path to unblock."
          : "Deployment signal ingested successfully.",
    metadata: {
      environment: deployment.target ?? "preview",
      readyState: deployment.readyState,
      commitRef: deployment.meta?.githubCommitRef ?? "",
      url: deployment.meta?.url ?? "",
    },
  };
}

function mapDeploymentToEvent(deployment: VercelDeployment): ControlEvent {
  return {
    id: `live-vercel-event-${deployment.uid}`,
    source: "vercel",
    artifactId: `live-vercel-deploy-${deployment.uid}`,
    kind: `deploy_${deployment.readyState.toLowerCase()}`,
    at: formatRelativeTime(deployment.createdAt),
    summary: `${deployment.name} reported ${deployment.readyState.toLowerCase()} state.`,
    actor: "Vercel",
  };
}

export async function getVercelBundle(): Promise<SourceBundle> {
  if (!isLiveVercelEnabled()) {
    return buildSeedSourceBundle("vercel", controlDataset);
  }

  const params = new URLSearchParams({
    projectId: process.env.NOVUA_CONTROL_VERCEL_PROJECT_ID!,
    limit: "8",
  });

  if (process.env.NOVUA_CONTROL_VERCEL_TEAM_ID) {
    params.set("teamId", process.env.NOVUA_CONTROL_VERCEL_TEAM_ID);
  }

  try {
    const response = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Vercel connector failed with ${response.status}`);
    }

    const payload = (await response.json()) as { deployments?: VercelDeployment[] };
    const deployments = payload.deployments ?? [];
    const artifacts = deployments.map(mapDeploymentToArtifact);
    const events = deployments.map(mapDeploymentToEvent);

    return {
      source: "vercel",
      mode: "live",
      artifacts,
      events,
      signals: [],
    };
  } catch {
    return buildSeedSourceBundle("vercel", controlDataset);
  }
}
