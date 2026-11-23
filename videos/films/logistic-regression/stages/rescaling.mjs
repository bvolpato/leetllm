import { pairEvidence, validationScores } from '../fixtures.mjs';
import { mix, progress, smooth } from '../construction.mjs';
import { M, T, line, mark } from '../defaults.mjs';
export function drawRescaling(ctx, scene, state, api) {
  const change = progress(state, 'rescale-scores', 0),
    cut = progress(state, 'rescale-threshold', 1),
    teaching = mix(0.5, 0.25, smooth(cut)),
    sorted = [...validationScores].sort((a, b) => b.p - a.p);
  T(ctx, api, 'Same request order · same 13 / 16 ranking wins', 840, 275, 34, api.C.muted);
  for (let i = 0; i < 16; i++) {
    const x = 1485 + (i % 4) * 33,
      y = 290 + Math.floor(i / 4) * 29;
    api.rect(ctx, x, y, 25, 21, pairEvidence[i].win ? api.C.green : api.C.red, undefined, 2);
  }
  T(ctx, api, '13 / 16', 1550, 245, 28, api.C.muted);
  mark(api, 'rescaled-scores', () =>
    sorted.forEach((v, i) => {
      const p = mix(v.p, v.p * v.p, smooth(change)),
        x = 260 + i * 185,
        h = 460 * p;
      api.rect(ctx, x, 825 - h, 110, h, v.label ? api.C.pink : api.C.blue, undefined, 5);
      T(ctx, api, v.id, x + 55, 935, 30, v.label ? api.C.pink : api.C.blue);
      T(ctx, api, p.toFixed(3), x + 55, 880, 29);
      if (p >= teaching) api.rect(ctx, x - 7, 815 - h, 124, h + 20, '#00000000', api.C.yellow, 5);
    }),
  );
  mark(api, 'rescaled-threshold', () => {
    const y = 825 - 460 * teaching;
    line(
      ctx,
      api,
      [
        {
          x: 210,
          y,
        },
        {
          x: 1740,
          y,
        },
      ],
      api.C.yellow,
      3,
    );
    T(ctx, api, 'cut ' + teaching.toFixed(2), 1690, y - 25, 30, api.C.yellow);
  });
  M(ctx, api, change === 1 ? 'p\\longmapsto p^2' : 'p\\longmapsto\\,?', 960, 990, 45, api.C.cyan);
}
export default {
  id: 'rescaling',
  draw: drawRescaling,
  cues: ['rescale-scores', 'rescale-threshold'],
};
