import { checkpointLayout } from '../construction.mjs';
import { spokenProgress } from '../defaults.mjs';
import { drawProbe, drawShardMap } from '../shard-map.mjs';

export function drawRecovery(ctx, scene, state, api) {
  const { beat } = state;
  const repair = spokenProgress(state, api, 'recover-fill', 1, 0.76, 1);
  const missing = checkpointLayout(2);
  const late = repair === 0;
  drawShardMap(ctx, api, {
    showNew: true,
    markColumn: true,
    late,
    copies: missing.reconstructed.map((value) => (value === null ? repair : 1)),
    showMissing: beat === 1,
  });
  if (beat === 2) {
    drawProbe(ctx, api, spokenProgress(state, api, 'recover-fixed-score', 2, 0.48, 0.55) >= 1);
  } else {
    api.text(
      ctx,
      beat === 0
        ? 'Probe at column 6     2 × 1.5 = 3'
        : repair === 1
          ? '8 of 8 values at their saved global positions'
          : 'Hold columns 4 and 5 for saved rank 2',
      960,
      990,
      43,
      repair === 1 ? api.C.green : api.C.ink,
      'center',
    );
  }
}

export default {
  id: 'recovery',
  draw: drawRecovery,
  cues: [
    'recover-probe',
    'recover-gap',
    'recover-offsets',
    'recover-fill',
    'recover-fixed-probe',
    'recover-fixed-score',
  ],
};
