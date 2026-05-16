import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IngestionPreview } from "./ingestion";
import {
  getAlertKeywords,
  getArtifactKeywords,
  replaceArtifactsForAlert,
} from "./matching";
import type {
  AlertSeed,
  AuditEntry,
  ControlArtifact,
  ControlDataset,
  ControlStore,
  IncidentState,
  IncidentTransition,
} from "./types";

const STORE_FILE = process.env.NOVUA_CONTROL_STORE_FILE
  ? path.resolve(process.env.NOVUA_CONTROL_STORE_FILE)
  : process.env.VERCEL
    ? "/tmp/novua-control-store.json"
    : path.join(process.cwd(), ".novua-control-store.json");

const EMPTY_STORE: ControlStore = {
  ingestions: [],
  incidents: [],
  auditTrail: [],
};

export type PersistedDatasetOverlay = {
  artifacts: ControlArtifact[];
  events: ControlDataset["events"];
  signals: ControlDataset["signals"];
  auditTrail: AuditEntry[];
  alertStates: Partial<Record<string, IncidentState>>;
  incidentTransitions: IncidentTransition[];
};

type StateEvaluation = {
  state: IncidentState;
  reason: string;
};

function isWritableStorePath() {
  return Boolean(STORE_FILE);
}

function isValidState(value: unknown): value is IncidentState {
  return [
    "detected",
    "triaged",
    "assigned",
    "mitigating",
    "resolved",
    "reopened",
  ].includes(String(value));
}

function toStore(input: unknown): ControlStore {
  if (!input || typeof input !== "object") {
    return EMPTY_STORE;
  }

  const record = input as Partial<ControlStore>;

  return {
    ingestions: Array.isArray(record.ingestions) ? record.ingestions : [],
    incidents: Array.isArray(record.incidents) ? record.incidents : [],
    auditTrail: Array.isArray(record.auditTrail) ? record.auditTrail : [],
  };
}

async function ensureStoreDirectory() {
  if (!isWritableStorePath()) {
    return;
  }

  await mkdir(path.dirname(STORE_FILE), { recursive: true });
}

export async function readControlStore(): Promise<ControlStore> {
  if (!isWritableStorePath()) {
    return EMPTY_STORE;
  }

  try {
    const content = await readFile(STORE_FILE, "utf8");
    return toStore(JSON.parse(content));
  } catch {
    return EMPTY_STORE;
  }
}

async function writeControlStore(store: ControlStore) {
  if (!isWritableStorePath()) {
    return;
  }

  await ensureStoreDirectory();
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function findAffectedAlertIds(preview: IngestionPreview, dataset: ControlDataset) {
  const alerts = dataset.alertSeeds.map((seed) => ({
    id: seed.id,
    keywords: getAlertKeywords(seed, dataset),
    services: new Set(
      seed.artifactIds
        .map((artifactId) => dataset.artifacts.find((artifact) => artifact.id === artifactId)?.service)
        .filter((service): service is string => Boolean(service)),
    ),
  }));

  const affected = new Set<string>();

  for (const artifact of preview.artifacts) {
    const artifactKeywords = getArtifactKeywords(artifact);

    for (const alert of alerts) {
      const exactServiceMatch = alert.services.has(artifact.service);
      const keywordMatch = Array.from(artifactKeywords).some((keyword) =>
        alert.keywords.has(keyword),
      );

      if (exactServiceMatch || keywordMatch) {
        affected.add(alert.id);
      }
    }
  }

  return Array.from(affected);
}

function getRelevantArtifactsForAlert(
  seed: AlertSeed,
  dataset: ControlDataset,
  persistedArtifacts: ControlArtifact[],
) {
  const seedArtifacts = replaceArtifactsForAlert(seed, dataset, persistedArtifacts);

  const alertServices = new Set(seedArtifacts.map((artifact) => artifact.service));
  const alertKeywords = getAlertKeywords(seed, dataset);

  const matchingPersistedArtifacts = persistedArtifacts.filter((artifact) => {
    if (alertServices.has(artifact.service)) {
      return true;
    }

    const artifactKeywords = getArtifactKeywords(artifact);
    return Array.from(artifactKeywords).some((keyword) => alertKeywords.has(keyword));
  });

  return replaceArtifactsForAlert(seed, dataset, matchingPersistedArtifacts);
}

function deriveIncidentState(
  seed: AlertSeed,
  artifacts: ControlArtifact[],
  previousState: IncidentState,
): StateEvaluation {
  const blockingArtifacts = artifacts.filter((artifact) =>
    ["blocked", "failed", "waiting_review", "queued"].includes(artifact.status),
  );
  const ownerGap = blockingArtifacts.some((artifact) => artifact.owner === null);
  const hasMotion = artifacts.some((artifact) =>
    ["healthy", "in_progress"].includes(artifact.status),
  );

  if (blockingArtifacts.length === 0) {
    return {
      state: "resolved",
      reason: "No blocking artifacts remain in the linked execution path.",
    };
  }

  if (previousState === "resolved") {
    return {
      state: "reopened",
      reason: "A new blocking artifact re-opened a previously resolved incident.",
    };
  }

  if (!seed.owner) {
    return {
      state: "detected",
      reason: "A blocking condition was detected before an escalation owner was assigned.",
    };
  }

  if (ownerGap) {
    return {
      state: "triaged",
      reason:
        "The incident has an escalation owner, but a functional owner is still missing on the blocking path.",
    };
  }

  if (hasMotion) {
    return {
      state: "mitigating",
      reason: "Linked artifacts are actively moving after ownership was established.",
    };
  }

  return {
    state: "assigned",
    reason: "An escalation owner is assigned and the incident is waiting on the next operational move.",
  };
}

function buildIngestionAuditEntry(
  alertId: string,
  preview: IngestionPreview,
  actor: string,
): AuditEntry {
  return {
    id: `audit-ingest-${alertId}-${preview.source}-${preview.receivedAt}`,
    alertId,
    at: preview.receivedAt,
    actor,
    action: "Webhook ingested",
    details: `Stored ${preview.events.length} event(s) and ${preview.signals.length} signal(s) from ${preview.source} ${preview.eventType}.`,
  };
}

function buildTransition(
  alertId: string,
  actor: string,
  at: string,
  fromState: IncidentState,
  toState: IncidentState,
  reason: string,
): IncidentTransition {
  return {
    id: `transition-${alertId}-${fromState}-${toState}-${at}`,
    alertId,
    at,
    actor,
    fromState,
    toState,
    reason,
  };
}

function buildTransitionAuditEntry(
  transition: IncidentTransition,
): AuditEntry {
  return {
    id: `audit-${transition.id}`,
    alertId: transition.alertId,
    at: transition.at,
    actor: transition.actor,
    action: "State transition",
    details: transition.reason,
    beforeState: transition.fromState,
    afterState: transition.toState,
    reason: transition.reason,
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

export async function persistIngestionPreview(
  preview: IngestionPreview,
  dataset: ControlDataset,
) {
  const store = await readControlStore();
  const existingEventIds = new Set(
    store.ingestions.flatMap((ingestion) => ingestion.events.map((event) => event.id)),
  );
  const duplicate =
    preview.events.length > 0 && preview.events.every((event) => existingEventIds.has(event.id));

  if (duplicate) {
    return {
      stored: false,
      duplicate: true,
      affectedAlerts: store.incidents,
    };
  }

  const ingestionId =
    preview.events[0]?.id ??
    preview.artifacts[0]?.id ??
    `${preview.source}-${preview.eventType}-${preview.receivedAt}`;

  store.ingestions.push({
    id: ingestionId,
    source: preview.source,
    eventType: preview.eventType,
    receivedAt: preview.receivedAt,
    artifacts: preview.artifacts,
    events: preview.events,
    signals: preview.signals,
  });

  const persistedArtifacts = dedupeById(
    store.ingestions.flatMap((ingestion) => ingestion.artifacts),
  );
  const affectedAlertIds = findAffectedAlertIds(preview, dataset);

  for (const alertId of affectedAlertIds) {
    const seed = dataset.alertSeeds.find((item) => item.id === alertId);

    if (!seed) {
      continue;
    }

    const currentRecord =
      store.incidents.find((incident) => incident.alertId === alertId) ?? null;
    const previousState = currentRecord?.state ?? seed.state;
    const relevantArtifacts = getRelevantArtifactsForAlert(seed, dataset, persistedArtifacts);
    const evaluation = deriveIncidentState(seed, relevantArtifacts, previousState);

    store.auditTrail.push(
      buildIngestionAuditEntry(alertId, preview, `${preview.source} webhook`),
    );

    if (!currentRecord) {
      store.incidents.push({
        alertId,
        state: evaluation.state,
        owner: seed.owner,
        updatedAt: preview.receivedAt,
        transitions:
          evaluation.state !== previousState
            ? [
                buildTransition(
                  alertId,
                  "Novua Control state machine",
                  preview.receivedAt,
                  previousState,
                  evaluation.state,
                  evaluation.reason,
                ),
              ]
            : [],
      });

      if (evaluation.state !== previousState) {
        const transition = store.incidents
          .find((incident) => incident.alertId === alertId)
          ?.transitions.at(-1);

        if (transition) {
          store.auditTrail.push(buildTransitionAuditEntry(transition));
        }
      }

      continue;
    }

    if (currentRecord.state === evaluation.state) {
      currentRecord.updatedAt = preview.receivedAt;
      continue;
    }

    const transition = buildTransition(
      alertId,
      "Novua Control state machine",
      preview.receivedAt,
      currentRecord.state,
      evaluation.state,
      evaluation.reason,
    );

    currentRecord.state = evaluation.state;
    currentRecord.updatedAt = preview.receivedAt;
    currentRecord.transitions.push(transition);
    store.auditTrail.push(buildTransitionAuditEntry(transition));
  }

  store.ingestions = dedupeById(store.ingestions);
  store.auditTrail = dedupeById(store.auditTrail);

  for (const incident of store.incidents) {
    incident.transitions = dedupeById(incident.transitions);
  }

  await writeControlStore(store);

  return {
    stored: true,
    duplicate: false,
    affectedAlerts: store.incidents.filter((incident) =>
      affectedAlertIds.includes(incident.alertId),
    ),
  };
}

export async function getPersistedDatasetOverlay(): Promise<PersistedDatasetOverlay> {
  const store = await readControlStore();
  const artifacts = dedupeById(
    store.ingestions.flatMap((ingestion) => ingestion.artifacts),
  );
  const events = dedupeById(
    store.ingestions.flatMap((ingestion) => ingestion.events),
  );
  const signals = dedupeById(
    store.ingestions.flatMap((ingestion) => ingestion.signals),
  );

  return {
    artifacts,
    events,
    signals,
    auditTrail: dedupeById(store.auditTrail),
    alertStates: Object.fromEntries(
      store.incidents
        .filter((incident) => isValidState(incident.state))
        .map((incident) => [incident.alertId, incident.state]),
    ),
    incidentTransitions: dedupeById(
      store.incidents.flatMap((incident) => incident.transitions),
    ),
  };
}
