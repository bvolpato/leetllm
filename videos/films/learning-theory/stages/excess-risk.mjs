import { cueEnded, cueProgress, focusOn, line, text } from '../defaults.mjs';
import { percent } from '../risk-ruler.mjs';

export function drawExcessRisk(ctx, scene, state, api) {
  const { C } = api;
  const best = 0.25,
    radius = 0.04,
    tie = best + radius,
    upper = tie + radius;
  const x = (v) => 430 + (v - 0.22) * 8300;
  const first = cueProgress(state, 'first-deviation'),
    second = cueProgress(state, 'second-deviation');
  focusOn(api, 'risk-steps', () => {
    text(
      ctx,
      api,
      'A pool with two tied sample winners   ·   uniform radius 4 percentage points',
      960,
      285,
      36,
      C.muted,
      'center',
    );
    for (const [name, y] of [
      ['Best in class', 475],
      ['Selected at tie', 695],
    ]) {
      text(ctx, api, name, 105, y + 12, 39, C.ink);
      line(ctx, api, x(0.22), y, x(0.37), y, C.muted, 3);
    }
    api.circle(ctx, x(best), 475, 13, C.cyan);
    text(ctx, api, '25% population risk', x(best), 423, 34, C.cyan, 'center');
    if (first > 0) {
      line(ctx, api, x(best), 475, x(best + radius * first), 475, C.blue, 10);
      api.circle(ctx, x(best + radius * first), 475, 13, C.yellow);
    }
    if (cueEnded(state, 'first-deviation')) {
      line(ctx, api, x(tie), 494, x(tie), 676, C.yellow, 3);
      text(
        ctx,
        api,
        'Both score ' + percent(tie, 0) + ' on the sample',
        x(tie) + 28,
        588,
        36,
        C.yellow,
      );
      api.circle(ctx, x(tie), 695, 13, C.yellow);
    }
    if (second > 0) {
      line(ctx, api, x(tie), 695, x(tie + radius * second), 695, C.blue, 10);
      api.circle(ctx, x(tie + radius * second), 695, 13, C.cyan);
    }
    if (cueEnded(state, 'second-deviation'))
      text(ctx, api, percent(upper, 0) + ' population risk', x(upper), 775, 38, C.cyan, 'center');
    const footer =
      state.beat < 2
        ? 'How far apart can the two population risks be?'
        : cueEnded(state, 'second-deviation')
          ? 'Excess risk ≤ 2ε     ·     Selected risk ≤ best class risk + 2ε'
          : 'From the tie, take one more step of up to 4 points.';
    text(ctx, api, footer, 960, 904, 41, C.ink, 'center');
    if (state.beat >= 3)
      text(
        ctx,
        api,
        'Within η of the sample minimum? Add η to the allowance.',
        960,
        989,
        34,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'excess-risk',
  draw: drawExcessRisk,
  cues: ['tied-models', 'first-deviation', 'second-deviation', 'optimization-slack'],
};
