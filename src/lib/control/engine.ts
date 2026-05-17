import { getControlDataset } from "./repository";
import { replaceArtifactsForAlert } from "./matching";
import type {
  ConnectorMode,
  ControlArtifact,
  ControlDataset,
  DashboardSnapshot,
  DecisionAlert,
  PolicyRule,
  RuleEvaluation,
  SourceOverview,
  SourceSystem,
} from "./types";

const sourceOrder: SourceSystem[] = ["github", "vercel", "linear"];

function getSeverity(score: number): DecisionAlert["severity"] {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 65) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  return "watch";
}

async function hydrateAlert(
  alertId: string,
  dataset: ControlDataset,
): Promise<DecisionAlert> {
  const seed = dataset.alertSeeds.find((item) => item.id === alertId);

  if (!seed) {
    throw new Error(`Unknown alert seed: ${alertId}`);
  }

  const candidateArtifacts = dataset.artifacts.filter(
    (artifact) => !seed.artifactIds.includes(artifact.id),
  );
  const artifacts = replaceArtifactsForAlert(seed, dataset, candidateArtifacts).filter(
    (artifact): artifact is ControlArtifact => Boolean(artifact),
  );

  const rules = seed.triggeredRuleIds
    .map((ruleId) => dataset.policyRules.find((rule) => rule.id === ruleId))
    .filter((rule): rule is PolicyRule => Boolean(rule))
    .map((rule) => {
      const evidence = artifacts
        .filter((artifact) =>
          [
            "blocked",
            "waiting_review",
            "failed",
            "queued",
            "in_progress",
          ].includes(artifact.status),
        )
        .map((artifact) => `${artifact.label} (${artifact.updatedAt})`)
        .slice(0, 2)
        .join(", ");

      return {
        rule,
        evidence: evidence || "Triggered by linked artifact state.",
      } satisfies RuleEvaluation;
    });

  const riskScore = rules.reduce((total, current) => total + current.rule.points, 0);

  return {
    ...seed,
    artifacts,
    rules,
    riskScore,
    severity: getSeverity(riskScore),
  };
}

export async function getAlerts(): Promise<DecisionAlert[]> {
  const dataset = await getControlDataset();
  const alerts = await Promise.all(
    dataset.alertSeeds.map((seed) => hydrateAlert(seed.id, dataset)),
  );

  alerts.sort((left, right) => right.riskScore - left.riskScore);

  return alerts;
}

export async function getAlertById(
  alertId: string,
): Promise<DecisionAlert | null> {
  const dataset = await getControlDataset();
  const seed = dataset.alertSeeds.find((item) => item.id === alertId);

  if (!seed) {
    return null;
  }

  return hydrateAlert(alertId, dataset);
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const dataset = await getControlDataset();
  const alerts = await getAlerts();

  const primaryAlert = alerts[0];

  if (!primaryAlert) {
    throw new Error("Novua Control requires at least one seeded alert.");
  }

  const blockedArtifacts = dataset.artifacts.filter((artifact) =>
    ["blocked", "failed", "waiting_review"].includes(artifact.status),
  );

  const unownedArtifacts = dataset.artifacts.filter(
    (artifact) => artifact.owner === null,
  );

  const servicesAtRisk = Array.from(
    new Set(
      alerts
        .flatMap((alert) => alert.artifacts.map((artifact) => artifact.service))
        .filter(Boolean),
    ),
  );

  return {
    alerts,
    primaryAlert,
    blockedArtifacts,
    unownedArtifacts,
    servicesAtRisk,
    meanDecisionDelayHours: 11,
  };
}

export async function getSourceOverview(): Promise<SourceOverview[]> {
  const dataset = await getControlDataset();

  return sourceOrder.map((source) => ({
    source,
    mode: (dataset.sourceModes?.[source] ?? "seed") as ConnectorMode,
    artifacts: dataset.artifacts.filter((artifact) => artifact.source === source).length,
    events: dataset.events.filter((event) => event.source === source).length,
    signals: dataset.signals.filter((signal) => signal.source === source).length,
  }));
}

export async function getArtifactsBySource() {
  const dataset = await getControlDataset();

  return {
    github: dataset.artifacts.filter((artifact) => artifact.source === "github"),
    vercel: dataset.artifacts.filter((artifact) => artifact.source === "vercel"),
    linear: dataset.artifacts.filter((artifact) => artifact.source === "linear"),
  };
}

export async function getDependencyEdges() {
  const dataset = await getControlDataset();

  return dataset.dependencies.map((edge) => {
    const from = dataset.artifacts.find((artifact) => artifact.id === edge.fromId);
    const to = dataset.artifacts.find((artifact) => artifact.id === edge.toId);

    return {
      ...edge,
      from,
      to,
    };
  });
}

export async function getRecentEvents() {
  const dataset = await getControlDataset();

  return dataset.events;
}

export async function getAuditTrail(alertId?: string) {
  const dataset = await getControlDataset();

  if (!alertId) {
    return dataset.auditTrail;
  }

  return dataset.auditTrail.filter((entry) => entry.alertId === alertId);
}
