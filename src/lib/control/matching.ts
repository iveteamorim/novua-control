import type { AlertSeed, ControlArtifact, ControlDataset } from "./types";

export function normalizeKeywords(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

export function getArtifactKeywords(artifact: ControlArtifact) {
  const metadataText = Object.values(artifact.metadata ?? {})
    .filter((value) => typeof value === "string")
    .join(" ");

  return new Set(
    [artifact.label, artifact.service, artifact.summary, metadataText].flatMap(
      normalizeKeywords,
    ),
  );
}

export function getAlertKeywords(seed: AlertSeed, dataset: ControlDataset) {
  const artifacts = seed.artifactIds
    .map((artifactId) => dataset.artifacts.find((artifact) => artifact.id === artifactId))
    .filter((artifact): artifact is ControlArtifact => Boolean(artifact));

  return new Set(
    [
      seed.title,
      seed.summary,
      ...artifacts.flatMap((artifact) => [
        artifact.label,
        artifact.service,
        artifact.summary,
      ]),
    ].flatMap(normalizeKeywords),
  );
}

export function artifactsReferToSameWorkstream(
  left: ControlArtifact,
  right: ControlArtifact,
) {
  if (left.source !== right.source || left.type !== right.type) {
    return false;
  }

  if (left.service === right.service) {
    return true;
  }

  const leftKeywords = getArtifactKeywords(left);
  const rightKeywords = getArtifactKeywords(right);
  const overlap = Array.from(leftKeywords).filter((keyword) =>
    rightKeywords.has(keyword),
  ).length;

  return overlap >= 2;
}

export function replaceArtifactsForAlert(
  seed: AlertSeed,
  dataset: ControlDataset,
  candidateArtifacts: ControlArtifact[],
) {
  const seedArtifacts = seed.artifactIds
    .map((artifactId) => dataset.artifacts.find((artifact) => artifact.id === artifactId))
    .filter((artifact): artifact is ControlArtifact => Boolean(artifact));

  const replacements = seedArtifacts.map((seedArtifact) => {
    const replacement = candidateArtifacts
      .filter((artifact) => artifactsReferToSameWorkstream(seedArtifact, artifact))
      .at(-1);

    return replacement ?? seedArtifact;
  });

  const matchedCandidateIds = new Set(
    candidateArtifacts
      .filter((candidate) =>
        seedArtifacts.some((seedArtifact) =>
          artifactsReferToSameWorkstream(seedArtifact, candidate),
        ),
      )
      .map((artifact) => artifact.id),
  );

  const unmatchedCandidates = candidateArtifacts.filter(
    (artifact) => !matchedCandidateIds.has(artifact.id),
  );

  const uniqueById = new Map<string, ControlArtifact>();

  for (const artifact of [...replacements, ...unmatchedCandidates]) {
    uniqueById.set(artifact.id, artifact);
  }

  return Array.from(uniqueById.values());
}
