import { SHORT } from '../fixtures.mjs';
import { sourceSlate } from '../model.mjs';
import { cueProgress } from '../defaults.mjs';

const guide = SHORT[sourceSlate().selected[0]];
export function paintWrap(ctx, scene, state, api) {
  const { C } = api;
  const impression = cueProgress(state, api, 'wrap-impression', 1, 0.02, 0.35);
  const outcome = cueProgress(state, api, 'wrap-resolution', 1, 0.37, 0.63);
  const rows = [
    {
      target: 'wrap-proposal-row',
      event: 'Server proposes',
      detail: 'Slot 1 proposed',
      color: C.cyan,
      q: 1,
    },
    {
      target: 'wrap-impression-row',
      event: 'Browser displays',
      detail: 'Slot 1 rendered',
      color: C.blue,
      q: impression,
    },
    {
      target: 'wrap-resolution-row',
      event: 'Developer resolves',
      detail: 'Resolution recorded',
      color: C.green,
      q: outcome,
    },
  ];
  const label = (v, x, y, size, color) => api.text(ctx, v, x, y, size, color);
  label('Illustrative event sequence', 130, 268, 39, C.ink);
  for (const [name, x] of [
    ['Event', 214],
    ['Request', 782],
    ['Page', 1070],
    ['Observation', 1420],
  ]) {
    label(name, x, 368, 30, C.muted);
  }
  rows.forEach(({ target, event, detail, color, q }, i) => {
    const y = 466 + i * 144;
    api.focus.target(target, () => {
      if (i > 0 && q > 0) api.line(ctx, 150, y - 158, 150, y - 158 + 144 * q, color, 4);
      api.circle(ctx, 150, y - 14, 13, q > 0 ? color : C.bg, q > 0 ? color : C.muted, 3);
      if (q > 0) label(event, 214, y, 41, C.ink);
      if (q > 0) {
        label('R1', 782, y, 39, color);
        label(guide, 1070, y, 39, color);
        label(detail, 1420, y, 32, color);
      } else {
        label('?', 1420, y, 38, C.muted);
      }
    });
  });
  if ((state.beat ?? 0) < 1)
    label('Which event would confirm the guide appeared?', 133, 950, 42, C.yellow);
  if (outcome === 1) {
    api.line(ctx, 766, 817, 1320, 817, C.green, 3);
    label('Join on request and page', 768, 875, 34, C.green);
    if (state.beat >= 2)
      label('Compare task resolution across randomized developer groups.', 133, 975, 35, C.ink);
  }
}
export default {
  id: 'wrap',
  draw: paintWrap,
  cues: ['wrap-proposal', 'wrap-impression', 'wrap-resolution'],
};
