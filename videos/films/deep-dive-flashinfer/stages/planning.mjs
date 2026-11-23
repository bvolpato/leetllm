import { bracket, cachePicture } from '../cache-picture.mjs';
import { sampleModel } from '../construction.mjs';

export function drawPlanning(ctx, scene, state, api) {
  const { C } = api;
  const { pages, currentLength, plannedLength, appended, refreshed } = sampleModel(
    'planning',
    state,
  );
  api.focus.target('planning-lengths', () => {
    api.text(ctx, 'R2  /  same three physical pages', 130, 269, 40, C.ink);
    const bank = cachePicture(ctx, api, {
      pages,
      pageSize: 4,
      length: currentLength,
      style: (j) => (appended && j === currentLength - 1 ? { color: C.yellow, ink: C.yellow } : {}),
    });
    const right = (length) => bank.slot(length - 1) + bank.slotWidth - 4;
    for (const [length, label, y, color] of [
      [currentLength, 'Keys in the cache', 625, C.blue],
      [plannedLength, 'Keys in the plan', 805, C.cyan],
    ]) {
      bracket(ctx, api, bank.slot(0) + 4, right(length), y, color);
      api.text(ctx, label, 135, y + 62, 36, color);
      api.text(ctx, String(length), right(length), y + 62, 43, color, 'center');
    }
    if (refreshed) api.text(ctx, 'The next run can include k9.', 960, 963, 43, C.cyan, 'center');
    else if (appended)
      api.text(ctx, 'Does the old plan reach k9?', 960, 963, 43, C.yellow, 'center');
  });
}
export default {
  id: 'planning',
  draw: drawPlanning,
  cues: ['planning-prepare', 'planning-append', 'planning-limit', 'planning-beat-3-focus-1'],
};
