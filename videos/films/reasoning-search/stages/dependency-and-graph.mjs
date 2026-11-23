import { drawArrow, drawCard, drawFooter, drawText } from '../defaults.mjs';
export function drawDependencyAndGraph(ctx, scene, state, api) {
  api.focus.target('dependency-and-graph-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0, 0, 1),
      q = api.phase(progress, 0.05, 0.9);
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Least-to-most · each later question consumes the prior result',
          960,
          270,
          33,
          themeColors.ink,
          'center',
        );
        drawCard(ctx, api, 'Release diff', 160, 405, 440, 110, themeColors.blue, 34);
        drawCard(
          ctx,
          api,
          'Changed components\nauth + logging',
          740,
          405,
          440,
          150,
          themeColors.cyan,
          29,
        );
        drawCard(
          ctx,
          api,
          'Required checks\nsecurity + log schema',
          1350,
          405,
          440,
          150,
          themeColors.green,
          28,
        );
        drawArrow(ctx, api, 630, 460, 710, 460);
        drawArrow(ctx, api, 1210, 480, 1320, 480);
        drawText(
          ctx,
          api,
          'A wrong component list propagates to the required-check stage',
          960,
          865,
          31,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawCard(ctx, api, 'Security findings', 130, 380, 540, 110, themeColors.blue, 32);
        drawCard(ctx, api, 'Performance findings', 130, 650, 540, 110, themeColors.cyan, 32);
        drawCard(ctx, api, 'Combined release record', 1150, 500, 620, 130, themeColors.green, 32);
        drawArrow(ctx, api, 700, 435, 1120, 545, themeColors.blue);
        drawArrow(ctx, api, 700, 705, 1120, 585, themeColors.cyan);
        api.line(ctx, 1460, 660, 1460, 850, themeColors.yellow, 3);
        api.line(ctx, 1460, 850, 400, 850, themeColors.yellow, 3);
        drawArrow(ctx, api, 400, 850, 400, 790, themeColors.yellow);
        drawText(
          ctx,
          api,
          'Feedback can refine a candidate; retain and score the revision',
          960,
          960,
          29,
          themeColors.yellow,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Concurrent branches retain active histories',
          960,
          270,
          34,
          themeColors.ink,
          'center',
        );
        drawCard(ctx, api, 'Shared prefix', 150, 370, 1620, 90, themeColors.blue, 33);
        ['Security branch', 'Performance branch', 'Revision branch'].forEach((s, i) =>
          drawCard(
            ctx,
            api,
            s,
            150 + i * 570,
            630,
            480,
            110,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            31,
          ),
        );
        drawText(
          ctx,
          api,
          'Shared prefill may be reused; changed contexts and dependent calls still cost work',
          960,
          900,
          29,
          themeColors.yellow,
          'center',
        );
      }
      drawFooter(
        ctx,
        api,
        'Graph aggregation combines dependencies; it does not verify generated claims',
      );
    }
  });
}
export default {
  id: 'dependency-and-graph',
  draw: drawDependencyAndGraph,
  cues: ['dependency-and-graph-b1', 'dependency-and-graph-b2', 'dependency-and-graph-b3'],
};
