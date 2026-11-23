import { withPretrainingOriginalFrame } from './defaults.mjs';
import { paintPretrainingOriginalIntro } from './stages/intro.mjs';
import { paintPretrainingOriginalExtract } from './stages/extract.mjs';
import { paintPretrainingOriginalFilter } from './stages/filter.mjs';
import { paintPretrainingOriginalDedup } from './stages/dedup.mjs';
import { paintPretrainingOriginalInventory } from './stages/inventory.mjs';
import { paintPretrainingOriginalMixture } from './stages/mixture.mjs';
import { paintPretrainingOriginalBoundaries } from './stages/boundaries.mjs';
import { paintPretrainingOriginalLineage } from './stages/lineage.mjs';
import { paintPretrainingOriginalTransfer } from './legacy-transfer.mjs';
function selectPretrainingOriginal(ctx, scene, state, api, C, c, t, b, p, s) {
  if (scene.id === 'intro') {
    return paintPretrainingOriginalIntro(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'extract') {
    return paintPretrainingOriginalExtract(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'filter') {
    return paintPretrainingOriginalFilter(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'dedup') {
    return paintPretrainingOriginalDedup(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'inventory') {
    return paintPretrainingOriginalInventory(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'mixture') {
    return paintPretrainingOriginalMixture(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'boundaries') {
    return paintPretrainingOriginalBoundaries(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'lineage') {
    return paintPretrainingOriginalLineage(ctx, scene, state, api, C, c, t, b, p, s);
  } else if (scene.id === 'transfer') {
    return paintPretrainingOriginalTransfer(ctx, scene, state, api, C, c, t, b, p, s);
  } else throw new Error(`Unknown pretraining-data scene ${scene.id}`);
}
export function drawOriginal(ctx, scene, state, api) {
  withPretrainingOriginalFrame(ctx, scene, state, api, selectPretrainingOriginal);
}
