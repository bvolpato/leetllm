import { passageIds, scores } from '../fixtures.mjs';
import { libraryText, sundayQuestion } from '../library-shelf.mjs';
import { rerank } from '../model.mjs';

const order = rerank([0, 1, 2]);
const row = (rank) => 420 + 160 * rank;

export function drawReorderEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = focus.progress('order-pairs', 0);
  const settled = progress === 1;
  const packed = focus.progress('pack-two', 0) === 1;
  api.text(ctx, sundayQuestion, 135, 245, 48, C.ink);
  focus.target('order', () => {
    api.text(ctx, 'Retrieved', 135, 320, 34, C.muted);
    api.text(ctx, 'Logit', 583, 320, 32, C.muted, 'right');
    api.text(
      ctx,
      packed ? 'Sorted   ·   top two sent to assistant' : 'Sorted by logit',
      1070,
      320,
      34,
      packed ? C.yellow : C.muted,
    );
    for (let i = 0; i < order.length; i++) {
      const rank = order.indexOf(i);
      const color = i === 2 ? C.green : i === 1 ? C.muted : C.blue;
      api.text(ctx, `${i + 1}    ${passageIds[i]}`, 135, row(i) + 10, 38, color, 'left', 'mono');
      api.text(ctx, scores[i].toFixed(2), 583, row(i) + 10, 38, C.ink, 'right');
      const x = 610 + 398 * progress;
      const y = row(i) + (row(rank) - row(i)) * progress;
      if (progress > 0) api.line(ctx, 610, row(i), x, y, color, i === 2 ? 7 : 3);
      api.circle(ctx, x, y, i === 2 ? 10 : 6, color);
      if (settled) {
        const ink = packed && rank >= 2 ? C.muted : C.ink;
        api.text(
          ctx,
          `${rank + 1}    ${passageIds[i]}`,
          1070,
          row(rank) + 8,
          36,
          color,
          'left',
          'mono',
        );
        api.text(ctx, libraryText[i], 1070, row(rank) + 66, 37, ink);
      }
    }
    if (packed) api.line(ctx, 1050, row(1) + 99, 1810, row(1) + 99, C.yellow, 3);
  });
  focus.target('metrics', () => {
    const showRR = focus.progress('rr-change', 0) === 1;
    const metrics = showRR ? 'Reciprocal rank    1/3 → 1' : 'Same three passages';
    api.text(ctx, metrics, 140, 944, 41, C.ink);
    if (packed) api.text(ctx, 'Hours passage in top two    0 → 1', 910, 944, 41, C.green);
  });
}
export default {
  id: 'reorder-evidence',
  draw: drawReorderEvidence,
  cues: ['compare-order', 'order-pairs', 'pack-two', 'rr-change'],
};
