import { mix, phase, smooth } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';
import { broad, population } from '../fixtures.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const reveal = (id, start, end) => state.cues?.[id]
    ? cueProgress(state, id, 2)
    : state.beat === 2 ? phase(state.beatP ?? 0, start, end) : 0;
  const keep = smooth(reveal('opening-keep', 0, 0.2));
  const add = reveal('opening-clean', 0.2, 0.48);
  const risk = reveal('opening-risk', 0.62, 0.82);
  const queue = keep > 0;
  const clean = Math.floor(broad.fp * add);
  const total = broad.tp + clean;

  // The original slips keep their order as the view widens to fit the clean flags.
  const xStep = mix(81, 32, keep);
  const yStep = mix(56, 26, keep);
  const xStart = mix(927, 820, keep);
  const yStart = mix(288, 290, keep);
  function slip(index, color, flagged, drop = 0) {
    const block = Math.floor(index / 100);
    const x = xStart + (block % 3) * 348 + (index % 10) * xStep;
    const y = yStart + Math.floor(block / 3) * 292 + (Math.floor(index / 10) % 10) * yStep + drop;
    const w = xStep * 0.82, h = yStep * 0.72;
    rectangle(ctx, api, x, y, w, h, flagged ? color : C.panel, flagged ? undefined : color);
    if (flagged) rectangle(ctx, api, x, y, w * 0.16, h, C.yellow);
  }

  focus(api, 'opening-marks', () => {
    for (let i = 0; i < broad.tp; i++) slip(i, C.red, true);
    for (let i = 0; i < clean; i++) slip(population.abusive + i, C.blue, true);
  });
  if (keep < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - keep;
    focus(api, 'opening-misses', () => {
      for (let i = broad.tp; i < population.abusive; i++) slip(i, C.red, false, 64 * keep);
    });
    ctx.restore();
  }

  focus(api, 'opening-count', () => {
    api.rect(ctx, 105, 308, 638, 486, C.panel, C.yellow, 24);
    // The perforation separates the ticket heading from its count.
    for (let x = 137; x < 710; x += 32) line(ctx, api, x, 480, x + 14, 480, C.muted, 2);
    line(ctx, api, 162, 366, 162, 432, C.yellow, 6);
    rectangle(ctx, api, 162, 366, 54, 31, C.yellow);
    text(ctx, api, queue ? 'Review queue' : 'Detector audit', 246, 414, 51, C.ink, 'left');

    const denominator = queue ? (clean === broad.fp ? total : '?') : population.abusive;
    text(ctx, api, broad.tp + ' / ' + denominator, 423, 642, 113, C.ink);
    text(ctx, api, queue ? 'flags caught abuse' : 'abusive signups flagged', 423, 734, 40, C.yellow);
    if (risk === 1) {
      const oneIn = Math.round(total / broad.tp);
      text(ctx, api, 'About 1 in ' + oneIn + ' flags', 423, 905, 52, C.yellow);
    }
  });

  if (queue) {
    text(ctx, api, broad.tp + ' abusive', 980, 922, 42, C.red);
    if (clean > 0) text(ctx, api, clean + ' clean', 1530, 922, 42, C.blue);
  } else {
    text(ctx, api, '100 known abusive signups', 1320, 922, 45);
  }
}

export default {
  id: 'intro', draw: drawIntro,
  cues: ['opening-misses', 'opening-keep', 'opening-clean', 'opening-risk'],
};
