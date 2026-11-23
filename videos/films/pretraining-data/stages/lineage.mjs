import {
  drawText,
  legacyCard,
  legacyEquation,
  legacyText,
  line,
  note,
  tokenCells,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingOriginalLineage(ctx, scene, state, api, C, c, t, b, p, s) {
  const order = ['A', 'C', 'E', 'A', 'C', 'E'],
    cursor = b === 0 ? Math.min(2, Math.floor(3 * s(0))) : 2;
  legacyText(
    ctx,
    api,
    C,
    'Deterministic shard order for this cursor example',
    960,
    320,
    34,
    C.ink,
    'center',
  );
  order.forEach((id, i) =>
    api.focus.target('shard-order', () =>
      legacyCard(ctx, api, C, c, id, 240 + i * 250, 480, 200, i === cursor ? C.yellow : C.blue),
    ),
  );
  api.focus.target('sampler-cursor', () =>
    legacyEquation(ctx, api, C, '\\mathrm{cursor}=' + cursor, 550, 750, 48, C.yellow, 'center'),
  );
  api.focus.target('next-block', () =>
    legacyCard(
      ctx,
      api,
      C,
      c,
      (b === 0 ? 'Next block: ' : 'Restored next block: ') + order[cursor],
      1050,
      690,
      600,
      C.cyan,
    ),
  );
  legacyText(
    ctx,
    api,
    C,
    'Also retain tokenizer identity, worker progress, and RNG state for stochastic sampling',
    960,
    945,
    28,
    C.muted,
    'center',
  );
}
export function paintPretrainingMainLineage(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  const order = ['A', 'C', 'E', 'A', 'C', 'E'],
    cursor = b === 0 ? Math.min(2, Math.floor(p * 3)) : 2;
  drawText(
    ctx,
    api,
    C,
    'Manifest:shard bytes + tokenizer + policy identities',
    960,
    300,
    35,
    C.blue,
  );
  api.focus.target('shard-order', () => tokenCells(ctx, api, C, order, 240, 450, 245, C.blue));
  line(ctx, api, C, 230 + cursor * 245, 560, 230 + cursor * 245, 680, C.yellow, 4);
  api.focus.target('sampler-cursor', () =>
    drawText(ctx, api, C, 'Consumed cursor: ' + cursor, 960, 750, 38, C.yellow),
  );
  api.focus.target('next-block', () =>
    drawText(
      ctx,
      api,
      C,
      (b > 0 && D('cursor')) || b === 2
        ? 'Restore cursor 2 → next block E'
        : 'Restore the consumed cursor · next block ?',
      960,
      875,
      39,
      (b > 0 && D('cursor')) || b === 2 ? C.green : C.yellow,
    ),
  );
  note(
    ctx,
    api,
    C,
    'Original seed alone omits advancement · retain worker progress and relevant RNG state',
  );
}
export function drawLineageStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainLineage);
}
export default {
  id: 'lineage',
  draw: drawLineageStage,
  cues: ['lineage-b1-1', 'lineage-b2-1', 'lineage-b2-2', 'pt-lineage-cursor', 'lineage-b3-1'],
};
