import { poolSnapshot } from '../arithmetic.mjs';
import { OVERLAP_MAP, POOL_INCOMING, POOL_MAP } from '../fixtures.mjs';
import { cueClock } from '../footprint.mjs';
import { formatChapterValue as fmt, text } from '../defaults.mjs';
import { poolOutputs, poolPlane } from '../pooling-picture.mjs';

function fourReturns(beat, cue, phase) {
  if (beat < 2)
    return [
      cue('pool-route-0'),
      cue('pool-route-1'),
      phase(cue('pool-route-rest'), 0, 0.5),
      phase(cue('pool-route-rest'), 0.5, 1),
    ];
  if (beat === 2)
    return [
      phase(cue('average-route'), 0, 1 / 3),
      cue('average-split'),
      phase(cue('average-route'), 1 / 3, 2 / 3),
      phase(cue('average-route'), 2 / 3, 1),
    ];
  return [0, 1, 2, 3].map((i) => phase(cue('shared-gradients'), i / 4, (i + 1) / 4));
}

function packet(ctx, api, amount, split, t) {
  const color = amount < 0 ? api.C.pink : api.C.green;
  const x = api.lerp(1092, 808, t),
    y = 589;
  if (!split || t <= 0.18) {
    text(ctx, api, fmt(amount), x, y, 52, color, 'center');
    return;
  }
  const spread = api.phase(t, 0.18, 0.65);
  for (let i = 0; i < 4; i++) {
    const cx = x + (i % 2 ? 63 : -63) * spread;
    const cy = y + (i < 2 ? -48 : 48) * spread;
    if (spread < 0.78) api.circle(ctx, cx, cy, 7, color);
    else text(ctx, api, fmt(amount / 4), cx, cy, 31, color, 'center');
  }
}

export function drawPoolBackward(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const beat = state.beat;
  const split = beat >= 2,
    overlap = beat === 3;
  const image = overlap ? OVERLAP_MAP : POOL_MAP;
  const turns = fourReturns(beat, cue, api.phase);
  const moving = turns.findIndex((t) => t > 0 && t < 1);
  const selected = moving >= 0 ? moving : beat === 0 || turns.every((t) => t === 0) ? 1 : undefined;
  const delivered = POOL_INCOMING.map((row, r) =>
    row.map((v, c) => (turns[r * 2 + c] === 1 ? v : 0)),
  );
  const pool = poolSnapshot(image, {
    stride: overlap ? 1 : 2,
    mode: split ? 'average' : 'max',
    incoming: delivered,
  });
  api.focus.target('pool-return', () => {
    const reached = pool.owners.flatMap((owner, i) =>
      turns[i] === 1 ? (split ? owner.cells : [owner.input]) : [],
    );
    poolPlane(ctx, api, pool.gradient, {
      label: 'Input gradients · stride ' + (overlap ? 1 : 2),
      kind: 'gradient',
      activeWindow: selected,
      stride: overlap ? 1 : 2,
      selected: overlap ? [[1, 1]] : reached,
    });
    if (moving >= 0) packet(ctx, api, POOL_INCOMING.flat()[moving], split, turns[moving]);
    if (overlap && turns.every((t) => t === 1)) {
      const shares = POOL_INCOMING.flat().map((v) => v / 4);
      const expression =
        fmt(shares[0]) +
        shares
          .slice(1)
          .map((v) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v)))
          .join('');
      text(
        ctx,
        api,
        'Center    ' + expression + ' = ' + fmt(pool.gradient[1][1]),
        960,
        955,
        43,
        api.C.yellow,
        'center',
      );
    }
  });
  api.focus.target('pool-incoming', () =>
    poolOutputs(
      ctx,
      api,
      split ? 'Average pool · incoming gradient' : 'Max pool · incoming gradient',
      pool.owners.map((owner, i) => ({
        value: POOL_INCOMING.flat()[i],
        detail: split
          ? '÷ ' + owner.cells.length + ' inputs'
          : 'to (' + owner.input.join(', ') + ')',
        color: split ? api.C.cyan : api.C.yellow,
      })),
      selected,
    ),
  );
}
export default {
  id: 'pool-backward',
  draw: drawPoolBackward,
  cues: [
    'pool-signed',
    'pool-route-1',
    'pool-route-0',
    'pool-route-rest',
    'average-split',
    'average-route',
    'overlap-layout',
    'shared-gradients',
  ],
};
