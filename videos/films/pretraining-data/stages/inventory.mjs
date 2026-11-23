import { corpus } from '../fixtures.mjs';
import { inventoryFixture } from '../model.mjs';
import { withPretrainingOriginalFrame } from '../defaults.mjs';
import { tokenStrip } from '../record-visuals.mjs';

export function paintPretrainingOriginalInventory(ctx, scene, state, api, C) {
  const fixture = inventoryFixture();
  const progress = (id) => {
    const cue = state.cues?.['pt-inventory-' + id];
    return cue?.phase === 'after' ? 1 : cue?.phase === 'during' ? cue.progress : 0;
  };
  const done = (id) => state.cues?.['pt-inventory-' + id]?.phase === 'after';
  const filter = progress('filter'),
    merge = progress('merge');
  const scale = 1.6,
    left = 160,
    top = 436;
  const [raw, filtered, unique] = fixture.counts;
  const count = done('merge') ? unique : done('filter') ? filtered : raw;
  const mirror = corpus.find((r) => r.id === 'B');
  const menu = corpus.find((r) => r.id === 'D');
  const target = 700;
  const share = Math.round((100 * mirror.tokens) / filtered.tokens);
  api.focus.target('funnel-records', () => {
    api.text(ctx, 'Five extracted records  ·  one fixed tokenizer', left, 288, 38, C.ink);
    api.text(ctx, 'Score cutoff 0.50', 1760, 288, 34, C.muted, 'right');
    api.line(ctx, left, top - 23, left + raw.tokens * scale, top - 23, C.muted, 2);
    const move = (p) => api.phase(p, 0, 0.5);
    const close = (p) => api.phase(p, 0.52, 1);
    let original = 0;
    for (const row of corpus) {
      const isMenu = row === menu,
        isMirror = row === mirror;
      const drop = isMenu ? move(filter) : isMirror ? move(merge) : 0;
      let offset = original;
      if (row.id === 'E') offset -= menu.tokens * close(filter);
      if (['C', 'E'].includes(row.id)) offset -= mirror.tokens * close(merge);
      const x = left + offset * scale;
      tokenStrip(ctx, api, row, x, top + drop * 196, row.tokens * scale, { removed: drop === 1 });
      if (drop === 1)
        api.text(
          ctx,
          isMenu ? 'Below cutoff' : 'Copy of A',
          x + (row.tokens * scale) / 2,
          top + 348,
          28,
          C.muted,
          'center',
        );
      original += row.tokens;
    }
  });
  api.focus.target('funnel-counts', () => {
    api.text(ctx, count.tokens + ' retained tokens', left, 369, 48, C.cyan);
    api.text(ctx, count.documents + ' records', 1760, 369, 38, C.ink, 'right');
    if (done('filter') && !done('merge')) {
      api.text(
        ctx,
        'B repeats A. What fraction of the remaining tokens does B contain?',
        960,
        915,
        39,
        C.ink,
        'center',
      );
    } else if (done('merge') && !done('target')) {
      api.text(
        ctx,
        mirror.tokens + ' / ' + filtered.tokens + ' = ' + share + '% of the quality survivors',
        960,
        913,
        45,
        C.yellow,
        'center',
      );
    } else if (done('target')) {
      const gap = target - unique.tokens;
      api.text(
        ctx,
        'One pass gives ' + unique.tokens + ' of ' + target + ' planned presentations.',
        960,
        879,
        40,
        C.ink,
        'center',
      );
      if (done('gap'))
        api.text(
          ctx,
          gap + ' more presentations need repeats or new text.',
          960,
          964,
          42,
          C.yellow,
          'center',
        );
    }
  });
}
export function drawInventoryStage(ctx, scene, state, api) {
  withPretrainingOriginalFrame(ctx, scene, state, api, paintPretrainingOriginalInventory);
}
export default {
  id: 'inventory',
  draw: drawInventoryStage,
  cues: [
    'pt-inventory-filter',
    'pt-inventory-question',
    'pt-inventory-merge',
    'pt-inventory-target',
    'pt-inventory-gap',
  ],
};
