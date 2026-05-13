import { controlDataset } from "../fixtures";
import { buildSeedSourceBundle } from "../normalize";

export async function getLinearBundle() {
  return buildSeedSourceBundle("linear", controlDataset);
}
