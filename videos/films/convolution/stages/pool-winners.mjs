import { POOL_MAP } from '../fixtures.mjs';
import { poolSnapshot } from '../arithmetic.mjs';
import { poolOutputs, poolPlane, savedPool } from '../pooling-picture.mjs';
import { cueClock } from '../footprint.mjs';
import { text } from '../defaults.mjs';

export function drawPoolWinners(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const visits = savedPool.owners.map((_, i) => cue('pool-value-' + i));
  const average = state.beat === 2 && cue('pool-average') === 1;
  const tie = state.beat >= 3 && cue('pool-tie-edit') === 1;
  const image = POOL_MAP.map((row) => [...row]);
  if (tie) image[0][0] = savedPool.values[0][0];
  const pool = poolSnapshot(image, { mode: average ? 'average' : 'max' });
  const pendingTie = tie && cue('pool-tie') < 1;
  let window = Math.max(
    0,
    visits.findLastIndex((v) => v > 0),
  );
  if (state.beat > 1) window = state.beat === 2 ? 1 : 0;
  const known = pool.owners.filter((_, i) => visits[i] === 1 && !(i === 0 && pendingTie));
  const selected = average ? [] : known.map((owner) => owner.input);
  if (pendingTie) selected.push(savedPool.owners[0].input, [0, 0]);
  api.focus.target('pool-source', () =>
    poolPlane(ctx, api, image, {
      label: 'Response at each position',
      selected,
      activeWindow: window,
    }),
  );
  const saved = cue('pool-saved') === 1;
  api.focus.target('pool-output', () =>
    poolOutputs(
      ctx,
      api,
      average ? 'Mean of each window' : 'Maximum of each window',
      pool.owners.map((owner, i) => {
        const [r, c] = owner.output;
        const detail = average
          ? 'sum ÷ 4'
          : !saved || visits[i] < 1
            ? ''
            : i === 0 && pendingTie
              ? 'from ( ?, ? )'
              : 'from (' + owner.input.join(', ') + ')';
        return { value: visits[i] === 1 ? pool.values[r][c] : '?', detail, color: api.C.yellow };
      }),
      window,
    ),
  );
  const traveling = visits.find((v) => v > 0 && v < 1);
  if (traveling) {
    const [r, c] = pool.owners[window].output;
    const value = pool.values[r][c];
    text(ctx, api, value, api.lerp(770, 1090, traveling), 584, 48, api.C.green, 'center');
  }
  if (tie && cue('pool-tie') === 1)
    text(ctx, api, 'Same peak value. First match at (0, 0).', 960, 960, 38, api.C.yellow, 'center');
}
export default {
  id: 'pool-winners',
  draw: drawPoolWinners,
  cues: [
    'pool-forward',
    'pool-value-0',
    'pool-value-1',
    'pool-value-2',
    'pool-value-3',
    'pool-saved',
    'pool-average',
    'pool-tie-edit',
    'pool-tie',
  ],
};
