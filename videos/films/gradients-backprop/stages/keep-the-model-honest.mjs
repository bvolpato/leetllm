import { latencyExample } from '../arithmetic.mjs';
import {
  drawGraphBox,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
} from '../defaults.mjs';
export function drawKeepTheModelHonest(ctx, scene, state, api) {
  const { C: themeColors, rect } = api;
  const progress2 = api.clamp(state.p ?? 0);
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? progress2);
  const { ink, muted, cyan, blue, yellow, pink, green, red, panel } = themeColors;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    const solved = beat > 0;
    const gradientProgress =
      beat === 1
        ? api.focus.progress('challenge-gradient', api.phase(beatP, 0.12, 0.4))
        : beat === 2
          ? 1
          : 0;
    const update =
      beat === 1
        ? api.focus.progress('challenge-update', api.phase(beatP, 0.5, 0.9))
        : beat === 2
          ? 1
          : 0;
    const weights = [api.lerp(2, 1.7, update), api.lerp(2, 1.9, update)];
    const current = latencyExample(weights, [3, 1], 7);
    drawOriginalEquation(ctx, api, String.raw`\hat y=w_p x_p+w_q x_q`, 960, 280, 55, ink, 'center');
    api.focus.target('challenge-input', () =>
      drawGraphBox(ctx, api, {
        x: 395,
        y: 515,
        w: 480,
        h: 160,
        title: String.raw`(x_p,x_q)=(3,1)`,
        value: 'observed time 7 seconds',
        color: blue,
      }),
    );
    drawOriginalText(ctx, api, 'a new training request', 395, 385, 31, blue, 'center');
    drawShortArrow(ctx, api, ctx, 635, 515, 780, 515, muted, 4);
    api.focus.target('challenge-update', () =>
      drawGraphBox(ctx, api, {
        x: 960,
        y: 515,
        w: 360,
        h: 160,
        title: String.raw`(${weights[0].toFixed(2)},${weights[1].toFixed(2)})`,
        value: 'stored weights',
        color: yellow,
      }),
    );
    drawShortArrow(ctx, api, ctx, 1140, 515, 1280, 515, muted, 4);
    drawGraphBox(ctx, api, {
      x: 1510,
      y: 515,
      w: 460,
      h: 160,
      title: solved
        ? String.raw`\hat y=${Number(current.prediction.toFixed(3))}`
        : String.raw`\hat y=\;?`,
      value: solved ? 'error ' + Number(current.error.toFixed(3)) : 'error ?',
      color: solved ? green : pink,
    });
    if (solved)
      drawOriginalText(
        ctx,
        api,
        'gradient at the starting weights (2,2)',
        960,
        650,
        28,
        muted,
        'center',
      );
    api.focus.target('challenge-gradient', () =>
      drawOriginalEquation(
        ctx,
        api,
        gradientProgress > 0
          ? String.raw`\nabla L=2\times1\times(3,1)=(6,2)`
          : String.raw`\nabla L=(\;?,\;?\;)`,
        960,
        710,
        48,
        yellow,
        'center',
      ),
    );
    if (solved)
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\eta=0.05\qquad L:1\longrightarrow ${current.loss.toFixed(3)}`,
        960,
        790,
        38,
        green,
        'center',
      );
    if (beat === 2)
      api.focus.target('challenge-heldout', () => {
        const unseen = latencyExample(weights, [1, 2], 4);
        const evaluated =
          api.focus.progress('challenge-unseen-result', api.phase(beatP, 0.25, 0.55)) >= 1;
        rect(ctx, 150, 840, 1620, 145, panel, pink, 16);
        drawOriginalText(
          ctx,
          api,
          'unseen request · (1,2) · observed 4 seconds',
          650,
          895,
          31,
          pink,
          'center',
        );
        api.focus.target('challenge-unseen-result', () =>
          drawOriginalEquation(
            ctx,
            api,
            String.raw`1.7\times1+1.9\times2=${evaluated ? unseen.prediction.toFixed(1) : '?'}`,
            1330,
            950,
            38,
            pink,
            'center',
          ),
        );
        drawOriginalText(ctx, api, 'a new measurement', 500, 950, 29, muted, 'center');
      });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'keep-the-model-honest',
  draw: drawKeepTheModelHonest,
  cues: [
    'challenge-input',
    'challenge-gradient',
    'challenge-update',
    'challenge-heldout',
    'challenge-unseen-result',
  ],
};
