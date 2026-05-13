import { controlDataset } from "../fixtures";
import { buildSeedSourceBundle, buildSignalsForArtifacts, formatRelativeTime } from "../normalize";
import type {
  ArtifactStatus,
  ControlArtifact,
  ControlEvent,
  SourceBundle,
} from "../types";

type GitHubReviewer = {
  login?: string;
};

type GitHubPullSummary = {
  number: number;
  title: string;
  draft: boolean;
  state: string;
  updated_at: string;
  html_url: string;
  user?: {
    login?: string;
  };
  assignee?: GitHubReviewer | null;
  assignees?: GitHubReviewer[];
  requested_reviewers?: GitHubReviewer[];
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
};

type GitHubPullDetail = GitHubPullSummary & {
  mergeable?: boolean | null;
  mergeable_state?: string | null;
  labels?: Array<{
    name?: string;
  }>;
};

type GitHubReview = {
  state: string;
  submitted_at?: string;
  user?: {
    login?: string;
  };
};

type GitHubCheckRunsResponse = {
  total_count?: number;
  check_runs?: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
};

type GitHubLivePull = {
  summary: GitHubPullSummary;
  detail: GitHubPullDetail;
  reviews: GitHubReview[];
  failingChecks: number;
  owner: string | null;
  staleHours: number;
  approvalCount: number;
  changesRequested: boolean;
  reviewRequests: number;
};

const GITHUB_API_BASE = "https://api.github.com";

function isLiveGitHubEnabled() {
  return Boolean(
    process.env.NOVUA_CONTROL_ENABLE_GITHUB_LIVE === "1" &&
      process.env.GITHUB_TOKEN &&
      process.env.NOVUA_CONTROL_GITHUB_REPO,
  );
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "novua-control",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub connector failed with ${response.status} for ${path}`);
  }

  return response.json() as Promise<T>;
}

function hoursSince(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
}

function isBlockedMergeState(mergeableState: string | null | undefined) {
  return ["blocked", "dirty", "behind", "unstable"].includes(mergeableState ?? "");
}

function mapGitHubStatus(pull: GitHubLivePull): ArtifactStatus {
  if (pull.detail.draft) {
    return "in_progress";
  }

  if (
    pull.failingChecks > 0 ||
    pull.changesRequested ||
    isBlockedMergeState(pull.detail.mergeable_state)
  ) {
    return "blocked";
  }

  if (
    pull.reviewRequests > 0 ||
    pull.approvalCount === 0 ||
    pull.staleHours >= 12 ||
    !pull.owner
  ) {
    return "waiting_review";
  }

  return "in_progress";
}

function getOwner(summary: GitHubPullSummary, detail: GitHubPullDetail) {
  return (
    detail.assignee?.login ??
    detail.assignees?.[0]?.login ??
    summary.assignee?.login ??
    summary.assignees?.[0]?.login ??
    null
  );
}

function buildGitHubSummary(pull: GitHubLivePull, status: ArtifactStatus) {
  if (status === "blocked") {
    if (pull.failingChecks > 0) {
      return "Pull request is blocked by failing checks and should not merge into the release path yet.";
    }

    if (pull.changesRequested) {
      return "Pull request is blocked by requested changes and still needs reviewer follow-through.";
    }

    return "Pull request is blocked by merge state and needs intervention before release can continue.";
  }

  if (!pull.owner) {
    return "Pull request has no explicit owner, which increases execution risk and slows coordination.";
  }

  if (pull.reviewRequests > 0) {
    return "Pull request is waiting on requested reviewers before the deployment path can move.";
  }

  if (pull.approvalCount === 0 && pull.staleHours >= 12) {
    return "Pull request has gone stale without approval on a potentially active release path.";
  }

  return "Pull request is actively moving and remains visible to the execution layer.";
}

function mapGitHubPullToArtifact(
  repo: string,
  pull: GitHubLivePull,
): ControlArtifact {
  const status = mapGitHubStatus(pull);
  const service = repo.split("/")[1] ?? "github-repository";

  return {
    id: `live-github-pr-${pull.detail.number}`,
    label: `PR #${pull.detail.number} ${pull.detail.title}`,
    type: "pull_request",
    source: "github",
    service,
    owner: pull.owner,
    status,
    updatedAt: formatRelativeTime(pull.detail.updated_at),
    summary: buildGitHubSummary(pull, status),
    metadata: {
      repository: repo,
      branch: pull.detail.head.ref,
      targetBranch: pull.detail.base.ref,
      draft: pull.detail.draft,
      mergeableState: pull.detail.mergeable_state ?? "unknown",
      approvals: pull.approvalCount,
      requestedReviewers: pull.reviewRequests,
      failingChecks: pull.failingChecks,
      staleHours: pull.staleHours,
      url: pull.detail.html_url,
      labels:
        pull.detail.labels
          ?.map((label) => label.name)
          .filter(Boolean)
          .join(", ") ?? "",
    },
  };
}

function buildGitHubEvents(pull: GitHubLivePull, artifactId: string): ControlEvent[] {
  const events: ControlEvent[] = [];
  const at = formatRelativeTime(pull.detail.updated_at);
  const actor = pull.detail.user?.login ?? "GitHub";

  if (!pull.owner) {
    events.push({
      id: `live-github-owner-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "owner_missing",
      at,
      summary: "Pull request has no explicit owner assigned.",
      actor: "Novua Control",
    });
  }

  if (pull.reviewRequests > 0) {
    events.push({
      id: `live-github-review-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "review_waiting",
      at,
      summary: `${pull.reviewRequests} reviewer request(s) still pending.`,
      actor,
    });
  }

  if (pull.approvalCount === 0 && pull.staleHours >= 12) {
    events.push({
      id: `live-github-stale-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "stale_review",
      at,
      summary: `Pull request has been stale for ${pull.staleHours}h without approval.`,
      actor: "Novua Control",
    });
  }

  if (pull.changesRequested) {
    events.push({
      id: `live-github-changes-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "changes_requested",
      at,
      summary: "Reviewer requested changes before merge can proceed.",
      actor: "GitHub Review",
    });
  }

  if (pull.failingChecks > 0) {
    events.push({
      id: `live-github-checks-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "checks_failing",
      at,
      summary: `${pull.failingChecks} check run(s) are failing on the current head.`,
      actor: "GitHub Checks",
    });
  }

  if (isBlockedMergeState(pull.detail.mergeable_state)) {
    events.push({
      id: `live-github-merge-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: "merge_blocked",
      at,
      summary: `Merge state is ${pull.detail.mergeable_state ?? "blocked"}.`,
      actor: "GitHub",
    });
  }

  if (events.length === 0) {
    events.push({
      id: `live-github-active-${pull.detail.number}`,
      source: "github",
      artifactId,
      kind: pull.detail.draft ? "draft_open" : "pr_updated",
      at,
      summary: pull.detail.draft
        ? "Draft pull request is still in progress."
        : "Pull request is moving without current blockers.",
      actor,
    });
  }

  return events;
}

async function fetchLivePull(
  repo: string,
  summary: GitHubPullSummary,
): Promise<GitHubLivePull> {
  const [detailResult, reviewsResult, checksResult] = await Promise.allSettled([
    githubFetch<GitHubPullDetail>(`/repos/${repo}/pulls/${summary.number}`),
    githubFetch<GitHubReview[]>(`/repos/${repo}/pulls/${summary.number}/reviews`),
    githubFetch<GitHubCheckRunsResponse>(
      `/repos/${repo}/commits/${summary.head.sha}/check-runs`,
    ),
  ]);

  const detail =
    detailResult.status === "fulfilled"
      ? detailResult.value
      : ({ ...summary, labels: [], mergeable: null, mergeable_state: null } satisfies GitHubPullDetail);

  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const checkRuns = checksResult.status === "fulfilled" ? checksResult.value.check_runs ?? [] : [];

  const approvalCount = reviews.filter((review) => review.state === "APPROVED").length;
  const changesRequested = reviews.some(
    (review) => review.state === "CHANGES_REQUESTED",
  );
  const reviewRequests = detail.requested_reviewers?.length ?? summary.requested_reviewers?.length ?? 0;
  const failingChecks = checkRuns.filter(
    (check) =>
      check.conclusion !== null &&
      !["success", "neutral", "skipped"].includes(check.conclusion),
  ).length;

  return {
    summary,
    detail,
    reviews,
    failingChecks,
    owner: getOwner(summary, detail),
    staleHours: hoursSince(detail.updated_at),
    approvalCount,
    changesRequested,
    reviewRequests,
  };
}

export async function getGitHubBundle(): Promise<SourceBundle> {
  if (!isLiveGitHubEnabled()) {
    return buildSeedSourceBundle("github", controlDataset);
  }

  const repo = process.env.NOVUA_CONTROL_GITHUB_REPO!;

  try {
    const pulls = await githubFetch<GitHubPullSummary[]>(
      `/repos/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=6`,
    );
    const livePulls = await Promise.all(
      pulls.map((pull) => fetchLivePull(repo, pull)),
    );

    const artifacts = livePulls.map((pull) => mapGitHubPullToArtifact(repo, pull));
    const events = livePulls.flatMap((pull) =>
      buildGitHubEvents(pull, `live-github-pr-${pull.detail.number}`),
    );

    return {
      source: "github",
      mode: "live",
      artifacts,
      events,
      signals: buildSignalsForArtifacts(artifacts, events),
    };
  } catch {
    return buildSeedSourceBundle("github", controlDataset);
  }
}
