import { retainedDrawArrow, retainedDrawPlot, retainedDrawText } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9);
  {
    const q = retainedDrawPlot(ctx, api),
      a = phaseForBeat(1),
      x = [1.5 + 0.8 * a, 0.6 * a];
    api.focus.target('first-direction', () =>
      retainedDrawArrow(ctx, api, q, [0, 0], [1.5, 0], themeColors.blue),
    );
    if (a > 0)
      api.focus.target('added-direction', () =>
        retainedDrawArrow(ctx, api, q, [1.5, 0], x, themeColors.pink),
      );
    const end = q.point(...x);
    api.focus.target('activation-point', () =>
      api.circle(ctx, end.x, end.y, 12, themeColors.yellow),
    );
    retainedDrawText(
      ctx,
      api,
      'first feature contribution: 1.5',
      1450,
      390,
      36,
      themeColors.blue,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      'second direction overlaps the first axis',
      1450,
      535,
      34,
      themeColors.pink,
      'center',
    );
    api.focus.target('raw-coordinate', () =>
      retainedDrawText(
        ctx,
        api,
        `raw coordinate 1 = ${x[0].toFixed(2)}`,
        1450,
        700,
        38,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b2-1', 'intro-b2-2', 'intro-b3-1'],
};
