import { getGitHubBundle } from "./connectors/github";
import { getLinearBundle } from "./connectors/linear";
import { getVercelBundle } from "./connectors/vercel";
import { controlDataset } from "./fixtures";
import { buildSignalsForArtifacts } from "./normalize";
import type { ControlDataset, SourceBundle, SourceSystem } from "./types";
import { getPersistedDatasetOverlay } from "./store";

function mergeLiveBundles(
  dataset: ControlDataset,
  bundles: SourceBundle[],
): ControlDataset {
  const liveBundles = bundles.filter((bundle) => bundle.mode === "live");

  const baseSignals =
    dataset.signals.length > 0
      ? dataset.signals
      : buildSignalsForArtifacts(dataset.artifacts, dataset.events);

  if (liveBundles.length === 0) {
    return {
      ...dataset,
      signals: baseSignals,
      sourceModes: Object.fromEntries(
        bundles.map((bundle) => [bundle.source, bundle.mode]),
      ) as Partial<Record<SourceSystem, SourceBundle["mode"]>>,
    };
  }

  const liveArtifacts = liveBundles.flatMap((bundle) => bundle.artifacts);
  const liveEvents = liveBundles.flatMap((bundle) => bundle.events);
  const liveSignals = liveBundles.flatMap((bundle) =>
    bundle.signals.length > 0
      ? bundle.signals
      : buildSignalsForArtifacts(bundle.artifacts, bundle.events),
  );

  return {
    ...dataset,
    artifacts: [...dataset.artifacts, ...liveArtifacts],
    events: [...dataset.events, ...liveEvents],
    signals: [...baseSignals, ...liveSignals],
    sourceModes: Object.fromEntries(
      bundles.map((bundle) => [bundle.source, bundle.mode]),
    ) as Partial<Record<SourceSystem, SourceBundle["mode"]>>,
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

async function mergePersistedOverlay(dataset: ControlDataset): Promise<ControlDataset> {
  const overlay = await getPersistedDatasetOverlay();

  if (
    overlay.artifacts.length === 0 &&
    overlay.events.length === 0 &&
    overlay.signals.length === 0 &&
    overlay.auditTrail.length === 0 &&
    overlay.incidentTransitions.length === 0
  ) {
    return dataset;
  }

  return {
    ...dataset,
    artifacts: dedupeById([...dataset.artifacts, ...overlay.artifacts]),
    events: dedupeById([...dataset.events, ...overlay.events]),
    signals: dedupeById([...dataset.signals, ...overlay.signals]),
    auditTrail: dedupeById([...dataset.auditTrail, ...overlay.auditTrail]),
    alertSeeds: dataset.alertSeeds.map((seed) =>
      overlay.alertStates[seed.id]
        ? { ...seed, state: overlay.alertStates[seed.id]! }
        : seed,
    ),
    incidentTransitions: dedupeById([
      ...(dataset.incidentTransitions ?? []),
      ...overlay.incidentTransitions,
    ]),
  };
}

export async function getControlDataset(): Promise<ControlDataset> {
  const bundles = await Promise.all([
    getGitHubBundle(),
    getVercelBundle(),
    getLinearBundle(),
  ]);

  const datasetWithLive = mergeLiveBundles(controlDataset, bundles);
  return mergePersistedOverlay(datasetWithLive);
}
