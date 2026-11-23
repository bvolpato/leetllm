import { CACHE_POSITIONS } from '../fixtures.mjs';
import { directedCue } from '../construction.mjs';
import { cacheChunkInSlots } from '../model.mjs';

const storageOrder = [2, 0, 1];
const queries = [1, 2];

export function drawCachedChunk(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const cue = (id, b) => directedCue(state, id, b);
  const open = cue('omit-mask', 2) > 0 && cue('restore-mask', 3) === 0;
  const computed = cue('compare-chunk', 1) > 0;
  const showRule = cue('build-mask', 1) > 0;
  const activeQueries = state.beat === 4 ? [2] : queries;
  const model = cacheChunkInSlots(activeQueries, storageOrder, !open);
  const x = [480, 796, 1112],
    rowY = [520, 765];
  const colors = [C.yellow, C.blue, C.cyan];

  label(
    state.beat === 4 ? 'One query at the end of its prefix' : 'Two queries in one call',
    960,
    253,
    38,
    C.ink,
  );
  const move = api.ease(cue('reorder-slots', 0));
  storageOrder.forEach((index, slot) => {
    focus.target('slot-' + slot, () => {
      label('slot ' + slot, x[slot], 330, 31, C.muted);
      const center = api.lerp(x[index], x[slot], move);
      const y = 389 + (index === 2 ? 68 : -4) * Math.sin(Math.PI * move);
      label('K ' + CACHE_POSITIONS[index], center, y, 43, colors[index]);
    });
  });
  label('Weight on value 802', 1550, 381, 34, C.ink);
  activeQueries.forEach((index, row) => {
    const y = rowY[row];
    const permitted = cue(index === 1 ? 'mask-first-row' : 'mask-next-row', 1) > 0;
    label('Q ' + CACHE_POSITIONS[index], 192, y + 16, 41, C.ink);
    model.permissions[row].forEach((allowed, slot) => {
      focus.target('cell-' + index + '-' + slot, () => {
        rect(
          ctx,
          x[slot] - 123,
          y - 62,
          246,
          124,
          C.panel,
          permitted ? (allowed ? colors[storageOrder[slot]] : C.red) : C.muted,
          11,
        );
        label(
          permitted ? (allowed ? 'allow' : 'hide') : '?',
          x[slot],
          y + 14,
          37,
          permitted ? (allowed ? C.ink : C.red) : C.muted,
        );
      });
    });
    focus.target('output-' + index, () => {
      const share = model.outputs[row][2],
        reference = model.reference[row][2];
      line(ctx, 1330, y + 23, 1770, y + 23, C.muted, 3);
      if (computed) {
        line(
          ctx,
          1330,
          y + 23,
          1330 + 440 * share,
          y + 23,
          open && index === 1 ? C.red : C.green,
          12,
        );
        api.circle(ctx, 1330 + 440 * share, y + 23, 7, open && index === 1 ? C.red : C.green);
      }
      label(computed ? share.toFixed(3) : '?', 1550, y - 15, 45, C.ink);
      if (computed) label('Full pass  ' + reference.toFixed(3), 1550, y + 92, 30, C.muted);
    });
  });
  const note = !showRule
    ? 'Which slot must query 801 hide?'
    : open
      ? 'No mask    ·    Same keys, values and rotations'
      : 'Allow a key when  keyPosition <= queryPosition';
  if (move === 1) label(note, 960, 970, 40, open ? C.yellow : C.ink);
}
export default {
  id: 'cached-chunk',
  draw: drawCachedChunk,
  cues: [
    'reorder-slots',
    'locate-future',
    'build-mask',
    'mask-first-row',
    'mask-next-row',
    'compare-chunk',
    'omit-mask',
    'inspect-leak',
    'restore-mask',
    'single-query',
  ],
};
