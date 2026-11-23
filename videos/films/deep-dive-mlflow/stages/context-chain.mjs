import { spokenScene } from '../pieces/scene.mjs';
import { mix } from '../arithmetic.mjs';
import { chip } from '../defaults.mjs';

export default spokenScene('context-chain', (ctx, scene, state, api, g) => {
  const { C } = api;
  const selected = [4, 12, 18, 21, 24, 31, 36, 40];
  const packed = [4, 18, 21];
  api.text(ctx, 'T104  /  return-window question', 145, 260, 37, C.ink);
  const head = (s, x) => api.text(ctx, s, x, 359, 32, C.muted);
  head('Retrieved   ·   40', 145);
  head('Reranked   ·   8', 762);
  head(state.beat === 0 || g(1, 2) === 0 ? 'Packed input' : 'Replay input', 1320);
  for (let i = 0; i < 40; i++) {
    const n = i + 1,
      x = 152 + (i % 5) * 92,
      y = 397 + Math.floor(i / 5) * 58;
    chip(ctx, api, String(n), x, y, 78, n === 12 ? C.yellow : C.muted, 48, n === 12 ? 30 : 25);
  }
  if (g(0, 1) > 0)
    selected.forEach((n, i) => {
      chip(
        ctx,
        api,
        'DOC-' + n,
        765 + (i % 2) * 173,
        411 + Math.floor(i / 2) * 104,
        155,
        n === 12 ? C.yellow : C.blue,
        70,
        28,
      );
    });
  if (g(0, 2) > 0)
    packed.forEach((n, i) => chip(ctx, api, 'DOC-' + n, 1320, 409 + i * 109, 357, C.cyan, 73, 32));
  const p = g(1, 2);
  if (p > 0) {
    // Carry the record through the free corridor below the reranked grid.
    const px = p < 0.48 ? 1148 : mix(1148, 1320, (p - 0.48) / 0.52);
    const py = p < 0.48 ? mix(412, 736, p / 0.48) : 736;
    chip(ctx, api, 'DOC-12', px, py, 150 + 207 * p, C.yellow, 72, 31);
  }
  const note =
    state.beat === 0
      ? g(0, 3) > 0
        ? 'At which boundary did DOC-12 first go missing?'
        : ''
      : state.beat === 1
        ? p > 0
          ? 'Inspect the replay output and score its citations.'
          : 'Reranked → packed: DOC-12 first disappears here.'
        : 'If DOC-12 was packed, inspect the instructions, answer and citation check.';
  if (note) api.text(ctx, note, 960, 955, 37, state.beat === 0 ? C.yellow : C.ink, 'center');
});
