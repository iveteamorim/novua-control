import { buildSignalsForArtifacts, formatRelativeTime } from "./normalize";
import type {
  ArtifactStatus,
  ControlArtifact,
  ControlEvent,
  ControlSignal,
  SourceSystem,
} from "./types";

type JsonRecord = Record<string, unknown>;

export type IngestionPreview = {
  source: SourceSystem;
  mode: "webhook-preview";
  eventType: string;
  receivedAt: string;
  artifacts: ControlArtifact[];
  events: ControlEvent[];
  signals: ControlSignal[];
  note?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function readRecord(value: unknown): JsonRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readLogin(value: unknown): string | null {
  const record = readRecord(value);
  return readString(record?.login) ?? null;
}

function readTimestamp(value: unknown) {
  const numberValue = readNumber(value);

  if (numberValue) {
    return formatRelativeTime(numberValue);
  }

  const stringValue = readString(value);
  return formatRelativeTime(stringValue ?? new Date().toISOString());
}

function mapGitHubStatus(options: {
  draft: boolean;
  mergeableState?: string;
  requestedReviewers: number;
  owner: string | null;
  reviewState?: string;
  failingCheck: boolean;
}): ArtifactStatus {
  if (options.draft) {
    return "in_progress";
  }

  if (
    options.failingCheck ||
    options.reviewState === "changes_requested" ||
    ["blocked", "dirty", "behind", "unstable"].includes(options.mergeableState ?? "")
  ) {
    return "blocked";
  }

  if (options.requestedReviewers > 0 || !options.owner) {
    return "waiting_review";
  }

  return "in_progress";
}

function mapVercelStatus(state?: string): ArtifactStatus {
  if (["ERROR", "CANCELED"].includes(state ?? "")) {
    return "failed";
  }

  if (["QUEUED", "BUILDING", "INITIALIZING"].includes(state ?? "")) {
    return "queued";
  }

  if (state === "READY") {
    return "healthy";
  }

  return "in_progress";
}

function inferGitHubService(options: {
  repositoryName: string;
  title: string;
  branch: string;
}) {
  const context = `${options.repositoryName} ${options.title} ${options.branch}`.toLowerCase();

  if (context.includes("checkout") && context.includes("api")) {
    return "checkout-api";
  }

  if (context.includes("checkout")) {
    return "checkout";
  }

  if (context.includes("worker") && context.includes("payment")) {
    return "payments-worker";
  }

  return options.repositoryName.split("/").at(-1) ?? options.repositoryName;
}

function buildEmptyPreview(
  source: SourceSystem,
  eventType: string,
  note: string,
): IngestionPreview {
  return {
    source,
    mode: "webhook-preview",
    eventType,
    receivedAt: new Date().toISOString(),
    artifacts: [],
    events: [],
    signals: [],
    note,
  };
}

export function normalizeGitHubWebhook(
  payload: unknown,
  eventType: string,
): IngestionPreview {
  const body = readRecord(payload);
  const pullRequest = readRecord(body?.pull_request);

  if (!pullRequest) {
    return buildEmptyPreview(
      "github",
      eventType,
      "Expected a GitHub webhook payload with pull_request context.",
    );
  }

  const number = readNumber(pullRequest.number);
  const title = readString(pullRequest.title);

  if (!number || !title) {
    return buildEmptyPreview(
      "github",
      eventType,
      "Pull request payload is missing number or title.",
    );
  }

  const assignees = readArray(pullRequest.assignees);
  const requestedReviewers = readArray(pullRequest.requested_reviewers);
  const review = readRecord(body?.review);
  const checkRun = readRecord(body?.check_run);
  const repository = readRecord(body?.repository);
  const head = readRecord(pullRequest.head);
  const base = readRecord(pullRequest.base);

  const owner =
    readLogin(pullRequest.assignee) ??
    readLogin(assignees[0]) ??
    null;

  const reviewState = readString(review?.state)?.toLowerCase();
  const checkConclusion = readString(checkRun?.conclusion)?.toLowerCase();
  const failingCheck = ["failure", "timed_out", "cancelled"].includes(
    checkConclusion ?? "",
  );
  const draft = readBoolean(pullRequest.draft);
  const mergeableState = readString(pullRequest.mergeable_state);
  const updatedAt = readTimestamp(pullRequest.updated_at);
  const repositoryName =
    readString(repository?.full_name) ?? readString(repository?.name) ?? "github-repo";
  const service = inferGitHubService({
    repositoryName,
    title,
    branch: readString(head?.ref) ?? "",
  });

  const status = mapGitHubStatus({
    draft,
    mergeableState,
    requestedReviewers: requestedReviewers.length,
    owner,
    reviewState,
    failingCheck,
  });

  const artifact: ControlArtifact = {
    id: `webhook-github-pr-${number}`,
    label: `PR #${number} ${title}`,
    type: "pull_request",
    source: "github",
    service,
    owner,
    status,
    updatedAt,
    summary:
      status === "blocked"
        ? "Pull request is currently blocking release execution."
        : status === "waiting_review"
          ? "Pull request is waiting on reviewer or ownership follow-through."
          : "Pull request remains active in the release path.",
    metadata: {
      repository: repositoryName,
      branch: readString(head?.ref) ?? "",
      targetBranch: readString(base?.ref) ?? "",
      mergeableState: mergeableState ?? "unknown",
      requestedReviewers: requestedReviewers.length,
      reviewState: reviewState ?? "",
      checkConclusion: checkConclusion ?? "",
      url: readString(pullRequest.html_url) ?? "",
    },
  };

  const primaryEventKind =
    eventType === "pull_request_review"
      ? reviewState === "changes_requested"
        ? "changes_requested"
        : "review_submitted"
      : eventType === "check_run"
        ? failingCheck
          ? "checks_failing"
          : "checks_updated"
        : readString(body?.action)
          ? `pull_request_${readString(body?.action)}`
          : "pull_request_updated";

  const events: ControlEvent[] = [
    {
      id: `webhook-github-event-${number}-${primaryEventKind}`,
      source: "github",
      artifactId: artifact.id,
      kind: primaryEventKind,
      at: updatedAt,
      summary:
        eventType === "pull_request_review" && reviewState
          ? `Review state changed to ${reviewState}.`
          : eventType === "check_run" && checkConclusion
            ? `Check run reported ${checkConclusion}.`
            : `GitHub reported ${readString(body?.action) ?? "an update"} on this pull request.`,
      actor:
        readLogin(review?.user) ??
        readLogin(checkRun?.app) ??
        readLogin(pullRequest.user) ??
        "GitHub",
    },
  ];

  if (!owner) {
    events.push({
      id: `webhook-github-owner-${number}`,
      source: "github",
      artifactId: artifact.id,
      kind: "owner_missing",
      at: updatedAt,
      summary: "Pull request has no explicit owner assigned.",
      actor: "Novua Control",
    });
  }

  if (requestedReviewers.length > 0) {
    events.push({
      id: `webhook-github-review-${number}`,
      source: "github",
      artifactId: artifact.id,
      kind: "review_waiting",
      at: updatedAt,
      summary: `${requestedReviewers.length} review request(s) still pending.`,
      actor: "GitHub",
    });
  }

  if (failingCheck) {
    events.push({
      id: `webhook-github-check-${number}`,
      source: "github",
      artifactId: artifact.id,
      kind: "checks_failing",
      at: updatedAt,
      summary: "A check run failed on the release path.",
      actor: "GitHub Checks",
    });
  }

  const signals = buildSignalsForArtifacts([artifact], events);

  return {
    source: "github",
    mode: "webhook-preview",
    eventType,
    receivedAt: new Date().toISOString(),
    artifacts: [artifact],
    events,
    signals,
  };
}

export function normalizeVercelWebhook(
  payload: unknown,
  eventType: string,
): IngestionPreview {
  const body = readRecord(payload);
  const deployment = readRecord(body?.deployment) ?? body;

  if (!deployment) {
    return buildEmptyPreview(
      "vercel",
      eventType,
      "Expected a Vercel deployment webhook payload.",
    );
  }

  const id = readString(deployment.uid) ?? readString(deployment.id);
  const name = readString(deployment.name) ?? "vercel-project";

  if (!id) {
    return buildEmptyPreview(
      "vercel",
      eventType,
      "Deployment payload is missing id or uid.",
    );
  }

  const state =
    readString(deployment.readyState) ??
    readString(deployment.state) ??
    "BUILDING";
  const target = readString(deployment.target) ?? "preview";
  const meta = readRecord(deployment.meta);
  const updatedAt = readTimestamp(
    deployment.createdAt ?? deployment.created_at ?? Date.now(),
  );

  const artifact: ControlArtifact = {
    id: `webhook-vercel-deploy-${id}`,
    label: `${name}-${target}`,
    type: "deployment",
    source: "vercel",
    service: name,
    owner: readString(meta?.githubCommitAuthorLogin) ?? null,
    status: mapVercelStatus(state),
    updatedAt,
    summary:
      state === "ERROR"
        ? "Deployment failed and should be reviewed before the release train continues."
        : state === "READY"
          ? "Deployment completed and released a new state signal."
          : "Deployment is still moving through the release path.",
    metadata: {
      state,
      target,
      url:
        readString(deployment.url) ??
        readString(meta?.url) ??
        "",
      commitRef: readString(meta?.githubCommitRef) ?? "",
    },
  };

  const events: ControlEvent[] = [
    {
      id: `webhook-vercel-event-${id}`,
      source: "vercel",
      artifactId: artifact.id,
      kind: `deploy_${state.toLowerCase()}`,
      at: updatedAt,
      summary: `${name} reported ${state.toLowerCase()} for the ${target} target.`,
      actor: "Vercel",
    },
  ];

  if (state === "ERROR" && target === "production") {
    events.push({
      id: `webhook-vercel-prod-${id}`,
      source: "vercel",
      artifactId: artifact.id,
      kind: "production_blocked",
      at: updatedAt,
      summary: "Production release path is blocked by a failed deployment.",
      actor: "Novua Control",
    });
  }

  const signals = buildSignalsForArtifacts([artifact], events);

  return {
    source: "vercel",
    mode: "webhook-preview",
    eventType,
    receivedAt: new Date().toISOString(),
    artifacts: [artifact],
    events,
    signals,
  };
}
