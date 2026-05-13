import { getGitHubBundle } from "./connectors/github";
import { getLinearBundle } from "./connectors/linear";
import { getVercelBundle } from "./connectors/vercel";
import { controlDataset } from "./fixtures";
import { buildSignalsForArtifacts } from "./normalize";
import type { ControlDataset, SourceBundle, SourceSystem } from "./types";

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

export async function getControlDataset(): Promise<ControlDataset> {
  const bundles = await Promise.all([
    getGitHubBundle(),
    getVercelBundle(),
    getLinearBundle(),
  ]);

  return mergeLiveBundles(controlDataset, bundles);
}
