import { cellTitles, cells } from '../fixtures.mjs';
import { cellBox, progress } from '../construction.mjs';
import { confusionFrame, policies, routedValidation, sweptValidation } from '../model.mjs';
import { T, chip, mark, token } from '../defaults.mjs';
export function drawConfusion(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    route = progress(state, 'route-validation', 0),
    current = confusionFrame(currentBeat, state.beatP ?? 0, state.cues),
    actors =
      currentBeat === 0
        ? routedValidation(route)
        : sweptValidation(
            currentBeat > 1
              ? 1
              : (state.cues?.['threshold-sweep-b2-2']?.progress ?? state.beatP ?? 0),
          );
  if (currentBeat === 2) {
    mark(api, 'review-cost-rule', () => T(ctx, api, 'Cost = $18 × FP + $120 × FN', 960, 250, 38));
    mark(api, 'review-cost-worked-example', () =>
      T(
        ctx,
        api,
        `At τ=${current.threshold.toFixed(2)}: $${current.cost} = $18 × ${current.counts.fp} + $120 × ${current.counts.fn}`,
        960,
        315,
        34,
        api.C.yellow,
      ),
    );
    const q = progress(state, 'cost-alternatives-b3-2', 2);
    mark(api, 'review-cost-alternatives', () =>
      policies
        .slice(0, Math.max(1, Math.ceil(q * 3)))
        .forEach((v, i) =>
          chip(
            ctx,
            api,
            `τ ${v.threshold.toFixed(2)} · queue ${v.queue} · USD ${v.cost}`,
            240 + i * 500,
            365,
            460,
            78,
            api.C.yellow,
            29,
          ),
        ),
    );
  } else T(ctx, api, 'Reserved cases · outcome colors remain attached', 960, 260, 33, api.C.muted);
  const arrived = actors.filter((v) => v.arrived),
    counts = Object.fromEntries(cells.map((k) => [k, arrived.filter((v) => v.cell === k).length]));
  ctx.save();
  if (currentBeat === 2) ctx.globalAlpha *= 0.42;
  for (const key of cells) {
    const box = cellBox(key),
      color =
        key === 'tp'
          ? api.C.green
          : key === 'fp'
            ? api.C.red
            : key === 'fn'
              ? api.C.pink
              : api.C.blue;
    mark(api, 'confusion-' + key, () => {
      T(ctx, api, cellTitles[key], box.x + box.w / 2, box.y + 40, 29, color);
      T(
        ctx,
        api,
        key.toUpperCase() + ' = ' + counts[key],
        box.x + box.w - 70,
        box.y + 88,
        32,
        color,
      );
      for (const v of actors.filter((v) => v.cell === key)) token(ctx, api, v, v.x, v.y);
    });
  }
  ctx.restore();
  mark(api, 'review-policy-cost', () =>
    T(
      ctx,
      api,
      arrived.length === 8
        ? `threshold ${current.threshold.toFixed(2)} · cost USD ${current.cost}`
        : `threshold ${current.threshold.toFixed(2)} · cost pending`,
      960,
      970,
      36,
      api.C.yellow,
    ),
  );
}
export default {
  id: 'confusion',
  draw: drawConfusion,
  cues: ['route-validation', 'threshold-sweep-b2-2', 'cost-alternatives-b3-2'],
};
