import { coreBox, coreText } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    coreBox(
      ctx,
      api,
      'Question: may an 18-day-old key stay active?',
      190,
      300,
      1540,
      105,
      themeColors.ink,
    );
    const plot = teaching.axes({
        x: 180,
        y: 460,
        width: 700,
        height: 380,
        xDomain: [-0.5, 2.5],
        yDomain: [-0.5, 2.5],
        equalUnits: true,
        xTicks: [0, 1, 2],
        yTicks: [0, 1, 2],
        fontSize: 24,
      }),
      a = plot.point(0, 0),
      z = plot.point(1, 0);
    api.circle(ctx, a.x, a.y, 22, 'transparent', themeColors.pink, 4);
    api.circle(ctx, a.x, a.y, 10, themeColors.yellow);
    api.circle(ctx, z.x, z.y, 12, themeColors.green);
    coreText(ctx, api, 'query / merge', 225, 565, 27, themeColors.pink);
    coreText(ctx, api, 'rotation', z.x, z.y - 40, 27, themeColors.green);
    coreText(ctx, api, 'Authored diagnostic projection', 530, 435, 29, themeColors.muted);
    coreBox(
      ctx,
      api,
      'Retrieved: failed security scan\nblocks merge',
      1030,
      485,
      700,
      140,
      themeColors.pink,
    );
    coreBox(
      ctx,
      api,
      'Needed: key > 14 days\nrequires a rotation ticket',
      1030,
      700,
      700,
      140,
      themeColors.green,
    );
    coreText(
      ctx,
      api,
      'A projection can collapse different clauses onto one point',
      960,
      925,
      32,
      themeColors.yellow,
    );
    coreText(
      ctx,
      api,
      currentBeat === 0
        ? 'Inspect the confusing neighbors before changing the index'
        : 'Diagnostic map → inspect geometry · serving candidate → measure retrieval',
      960,
      1005,
      29,
      themeColors.muted,
    );
  }
  return;
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-beat-1-focus-1',
    'opening-beat-1-focus-2',
    'opening-beat-2-focus-1',
    'opening-beat-3-focus-1',
  ],
};
