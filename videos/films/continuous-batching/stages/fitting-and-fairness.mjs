import { cueProgress } from '../defaults.mjs';

export function drawFittingAndFairness(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const scan = beat > 0 ? 1 : cueProgress(state, 'fairness-four', 0.61, 0.85);
  const finishCount = Math.floor(4 * scan);
  const local = 4 * scan - finishCount;
  const active = local > 0.08 && local < 0.86;
  const stopped = beat > 0 || cueProgress(state, 'fairness-head', 0.39, 0.52) > 0;

  function page(cx, label, color) {
    api.rect(ctx, cx - 105, 381, 210, 117, C.panel, color, 7);
    api.text(ctx, label, cx, 459, 46, color, 'center');
  }

  api.focus.target('fitting-and-fairness-mechanism', () => {
    api.text(ctx, 'Front of queue', 277, 285, 39, C.muted);
    api.text(ctx, 'Physical pages', 930, 285, 39, C.muted);
    api.text(ctx, 'D', 280, 460, 85, C.yellow);
    for (let i = 0; i < 2; i++)
      api.rect(ctx, 400 + 101 * i, 397, 89, 89, C.panel, C.yellow, 5);
    api.text(ctx, 'needs 2 together', 278, 570, 35, C.yellow);
    [0, 1].forEach(i => page(1030 + i * 240, 'C', C.pink));
    api.focus.target('fairness-free-page', () => page(1510, active ? 'S' + (finishCount + 1) : 'free', active ? C.green : C.muted));
    api.text(ctx, 'C keeps both', 1150, 570, 35, C.pink, 'center');
    if (stopped && scan === 0)
      api.text(ctx, 'Strict order leaves page 3 free', 960, 829, 44, C.ink, 'center');
    if (scan > 0) {
      api.text(ctx, 'Finished', 280, 789, 36, C.ink);
      for (let i = 0; i < 4; i++) {
        const color = i < finishCount ? C.green : C.muted;
        api.rect(ctx, 570 + i * 235, 710, 186, 119, C.panel, color, 7);
        if (i < finishCount) api.text(ctx, 'S' + (i + 1), 663 + i * 235, 789, 43, color, 'center');
      }
    }
    if (beat === 1)
      api.text(ctx, 'D still needs a second free page at the same boundary', 960, 945, 38, C.yellow, 'center');
  });
}
export default {
  id: 'fitting-and-fairness',
  draw: drawFittingAndFairness,
  cues: ['fitting-and-fairness-b1', 'fairness-head', 'fairness-four', 'fitting-and-fairness-b2'],
};
