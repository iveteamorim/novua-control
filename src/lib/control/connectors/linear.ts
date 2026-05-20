import { controlDataset } from "../fixtures";
import { buildSeedSourceBundle, buildSignalsForArtifacts, formatRelativeTime } from "../normalize";
import { getFreshWorkspaceIntegration } from "@/lib/oauth/provider-tokens";
import type {
  ControlArtifact,
  ControlEvent,
  SourceBundle,
  WorkspaceIntegrationRecord,
} from "../types";

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  updatedAt: string;
  url: string;
  priority?: number | null;
  assignee?: {
    displayName?: string | null;
    name?: string | null;
  } | null;
  state?: {
    name?: string | null;
    type?: string | null;
  } | null;
  project?: {
    name?: string | null;
  } | null;
};

type LinearTeamResponse = {
  data?: {
    team?: {
      key?: string | null;
      name?: string | null;
      issues?: {
        nodes?: LinearIssue[];
      } | null;
    } | null;
  };
  errors?: Array<{
    message?: string;
  }>;
};

type LinearConnectorConfig = {
  apiKey: string;
  teamKey: string;
};

function buildEmptyLinearBundle(): SourceBundle {
  return {
    source: "linear",
    mode: "seed",
    artifacts: [],
    events: [],
    signals: [],
  };
}

function getLinearConfig(
  integration?: WorkspaceIntegrationRecord | null,
): LinearConnectorConfig | null {
  if (integration === null) {
    return null;
  }

  if (integration?.provider === "linear") {
    if (integration.enabled && integration.apiKey && integration.teamKey) {
      return {
        apiKey: integration.apiKey,
        teamKey: integration.teamKey,
      };
    }

    return null;
  }

  if (
    process.env.NOVUA_CONTROL_ENABLE_LINEAR_LIVE === "1" &&
    process.env.LINEAR_API_KEY &&
    process.env.NOVUA_CONTROL_LINEAR_TEAM_KEY
  ) {
    return {
      apiKey: process.env.LINEAR_API_KEY,
      teamKey: process.env.NOVUA_CONTROL_LINEAR_TEAM_KEY,
    };
  }

  return null;
}

async function linearFetchIssues(config: LinearConnectorConfig) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query TeamIssues($teamKey: String!) {
          team(key: $teamKey) {
            key
            name
            issues(first: 6, orderBy: updatedAt) {
              nodes {
                id
                identifier
                title
                updatedAt
                url
                priority
                assignee {
                  displayName
                  name
                }
                state {
                  name
                  type
                }
                project {
                  name
                }
              }
            }
          }
        }
      `,
      variables: {
        teamKey: config.teamKey,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Linear connector failed with ${response.status}`);
  }

  const payload = (await response.json()) as LinearTeamResponse;

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "Linear connector query failed");
  }

  return payload.data?.team?.issues?.nodes ?? [];
}

function mapLinearStatus(issue: LinearIssue): ControlArtifact["status"] {
  const stateType = issue.state?.type?.toLowerCase() ?? "";
  const title = issue.title.toLowerCase();

  if (stateType === "completed" || stateType === "canceled") {
    return "healthy";
  }

  if (
    title.includes("blocked") ||
    title.includes("risk") ||
    title.includes("rollback") ||
    (issue.priority ?? 0) <= 1
  ) {
    return "blocked";
  }

  if (!issue.assignee) {
    return "waiting_review";
  }

  if (stateType === "backlog" || stateType === "unstarted") {
    return "queued";
  }

  return "in_progress";
}

function mapLinearArtifact(issue: LinearIssue): ControlArtifact {
  const status = mapLinearStatus(issue);

  return {
    id: `live-linear-issue-${issue.id}`,
    label: issue.identifier
      ? `${issue.identifier} ${issue.title}`
      : issue.title,
    type: "ticket",
    source: "linear",
    service: issue.project?.name ?? "linear-project",
    owner: issue.assignee?.displayName ?? issue.assignee?.name ?? null,
    status,
    updatedAt: formatRelativeTime(issue.updatedAt),
    summary:
      status === "blocked"
        ? "Issue is contributing active release or coordination pressure."
        : status === "waiting_review"
          ? "Issue has no explicit assignee and still needs ownership."
          : "Issue is being tracked through the execution layer.",
    metadata: {
      url: issue.url,
      priority: issue.priority ?? "",
      state: issue.state?.name ?? "",
    },
  };
}

function mapLinearEvents(issue: LinearIssue, artifactId: string): ControlEvent[] {
  const at = formatRelativeTime(issue.updatedAt);
  const stateName = issue.state?.name ?? "updated";
  const events: ControlEvent[] = [
    {
      id: `live-linear-event-${issue.id}`,
      source: "linear",
      artifactId,
      kind: `issue_${stateName.toLowerCase().replace(/\s+/g, "_")}`,
      at,
      summary: `${issue.title} is currently ${stateName.toLowerCase()}.`,
      actor: "Linear",
    },
  ];

  if (!issue.assignee) {
    events.push({
      id: `live-linear-owner-${issue.id}`,
      source: "linear",
      artifactId,
      kind: "owner_missing",
      at,
      summary: "Issue has no explicit owner assigned.",
      actor: "Novua Control",
    });
  }

  return events;
}

export async function getLinearBundle(
  integration?: WorkspaceIntegrationRecord | null,
): Promise<SourceBundle> {
  const activeIntegration = await getFreshWorkspaceIntegration(integration);
  const config = getLinearConfig(activeIntegration);

  if (integration !== undefined && !config) {
    return buildEmptyLinearBundle();
  }

  if (!config) {
    return buildSeedSourceBundle("linear", controlDataset);
  }

  try {
    const issues = await linearFetchIssues(config);
    const artifacts = issues.map(mapLinearArtifact);
    const events = issues.flatMap((issue) =>
      mapLinearEvents(issue, `live-linear-issue-${issue.id}`),
    );

    return {
      source: "linear",
      mode: "live",
      artifacts,
      events,
      signals: buildSignalsForArtifacts(artifacts, events),
    };
  } catch {
    if (integration) {
      return buildEmptyLinearBundle();
    }

    return buildSeedSourceBundle("linear", controlDataset);
  }
}
