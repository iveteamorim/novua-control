import type {
  ArtifactStatus,
  ControlArtifact,
  ControlDataset,
  ControlEvent,
  ControlSignal,
  ConnectorMode,
  SourceBundle,
  SourceSystem,
} from "./types";

function defaultEventKindForStatus(status: ArtifactStatus) {
  switch (status) {
    case "waiting_review":
      return "review_waiting";
    case "blocked":
      return "artifact_blocked";
    case "failed":
      return "artifact_failed";
    case "queued":
      return "artifact_queued";
    case "in_progress":
      return "artifact_in_progress";
    case "healthy":
    default:
      return "artifact_healthy";
  }
}

export function formatRelativeTime(input: string | number | Date) {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "just now";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
  ];

  let value = diffMinutes;
  let unit: Intl.RelativeTimeFormatUnit = "minute";

  for (const [limit, candidateUnit] of ranges) {
    if (Math.abs(value) < limit) {
      unit = candidateUnit;
      break;
    }

    if (candidateUnit === "minute") {
      value = Math.round(value / 60);
    } else if (candidateUnit === "hour") {
      value = Math.round(value / 24);
    } else if (candidateUnit === "day") {
      value = Math.round(value / 7);
    } else if (candidateUnit === "week") {
      value = Math.round(value / 4.34524);
    }

    unit = candidateUnit;
  }

  return formatter.format(value, unit);
}

export function buildSignalsForArtifacts(
  artifacts: ControlArtifact[],
  events: ControlEvent[],
): ControlSignal[] {
  const signals: ControlSignal[] = [];

  for (const artifact of artifacts) {
    const linkedEvents = events.filter((event) => event.artifactId === artifact.id);

    if (linkedEvents.length === 0) {
      signals.push({
        id: `signal-${artifact.source}-${artifact.id}-${artifact.status}`,
        source: artifact.source,
        artifactId: artifact.id,
        artifactType: artifact.type,
        kind: defaultEventKindForStatus(artifact.status),
        title: artifact.label,
        status: artifact.status,
        owner: artifact.owner,
        occurredAt: artifact.updatedAt,
        summary: artifact.summary,
        actor: artifact.source,
        metadata: artifact.metadata,
      });
      continue;
    }

    for (const event of linkedEvents) {
      signals.push({
        id: `signal-${event.id}`,
        source: event.source,
        artifactId: artifact.id,
        artifactType: artifact.type,
        kind: event.kind,
        title: artifact.label,
        status: artifact.status,
        owner: artifact.owner,
        occurredAt: event.at,
        summary: event.summary,
        actor: event.actor,
        metadata: artifact.metadata,
      });
    }
  }

  return signals;
}

export function buildSeedSourceBundle(
  source: SourceSystem,
  dataset: ControlDataset,
  mode: ConnectorMode = "seed",
): SourceBundle {
  const artifacts = dataset.artifacts.filter((artifact) => artifact.source === source);
  const events = dataset.events.filter((event) => event.source === source);

  return {
    source,
    mode,
    artifacts,
    events,
    signals: buildSignalsForArtifacts(artifacts, events),
  };
}
