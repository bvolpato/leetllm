import { independentObjective } from '../arithmetic.mjs';
import { drawText, note, rectangle, tokenCells, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainLabelLayout(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  const ids = [11, 12, 99, 21, 99],
    docs = [0, 0, 0, 1, 1],
    v = independentObjective(ids, docs);
  drawText(ctx, api, C, 'Inputs', 220, 350, 30, C.muted);
  tokenCells(ctx, api, C, ids, 440, 305, 245, C.blue);
  drawText(ctx, api, C, 'Document', 220, 460, 30, C.muted);
  tokenCells(ctx, api, C, docs, 440, 415, 245, C.cyan);
  if (b === 0) {
    drawText(ctx, api, C, 'Query 3 → key 2?', 960, 620, 38, C.yellow);
    if (D('blocked')) {
      rectangle(ctx, api, C, 750, 710, 420, 95, C.panel, C.pink);
      drawText(ctx, api, C, 'Different document: blocked', 960, 770, 31, C.pink);
    }
    note(
      ctx,
      api,
      C,
      'Allow only k≤q and equal document IDs · translate to the API mask convention',
    );
  } else if (b === 1) {
    drawText(ctx, api, C, 'Shifted targets', 220, 640, 29, C.muted);
    tokenCells(
      ctx,
      api,
      C,
      D('shifted') ? v.targets.map((v) => (v === -100 ? 'ignore' : v)) : Array(5).fill('pending'),
      440,
      595,
      245,
      D('shifted') ? C.cyan : C.muted,
    );
    if (D('three'))
      drawText(
        ctx,
        api,
        C,
        '3 supervised predictions · cross-document and final targets omitted',
        960,
        865,
        33,
        C.yellow,
      );
    note(ctx, api, C, '−100 controls loss eligibility · it does not block attention');
  } else {
    drawText(ctx, api, C, 'Unshifted labels', 220, 640, 29, C.muted);
    tokenCells(
      ctx,
      api,
      C,
      D('unshifted') ? v.labels.map((v) => (v === -100 ? 'ignore' : v)) : Array(5).fill('pending'),
      440,
      595,
      245,
      D('unshifted') ? C.cyan : C.muted,
    );
    if (beg('internal-shift')) {
      drawText(ctx, api, C, 'One internal shift', 960, 760, 30, C.muted);
      tokenCells(
        ctx,
        api,
        C,
        D('internal-shift') ? [12, 99, 'ignore', 99] : Array(4).fill('pending'),
        560,
        800,
        245,
        D('internal-shift') ? C.green : C.muted,
      );
    }
    if (D('once'))
      drawText(ctx, api, C, 'Do not shift an already-shifted array again', 960, 950, 31, C.pink);
    note(ctx, api, C, 'The two declared API conventions align the same three supervised targets');
  }
}
export function drawLabelLayoutStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainLabelLayout);
}
export default {
  id: 'label-layout',
  draw: drawLabelLayoutStage,
  cues: [
    'pt-label-layout-ids',
    'pt-label-layout-blocked',
    'pt-label-layout-shifted',
    'pt-label-layout-three',
    'pt-label-layout-unshifted',
    'pt-label-layout-internal-shift',
    'pt-label-layout-once',
  ],
};
