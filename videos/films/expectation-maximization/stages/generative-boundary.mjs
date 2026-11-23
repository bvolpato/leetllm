import { gammaDensity } from '../arithmetic.mjs';
import { constructedFrame } from '../construction.mjs';
import {
  drawConstructedArrow,
  drawConstructedBox,
  drawConstructedCurve,
  drawConstructedEquation,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawGenerativeBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    colors = [themeColors.blue, themeColors.pink];
  api.focus.target('generative-boundary-operation', () => {
    if (currentBeat === 0) {
      drawConstructedHead(ctx, api, '100 requests in each population');
      const reveal = f.progress('joint-populations');
      [0.25, 0.75].forEach((p, i) => {
        const x = 300 + i * 900;
        drawConstructedText(
          ctx,
          api,
          'population ' + (i ? 'B' : 'A'),
          x + 250,
          370,
          34,
          colors[i],
          'center',
        );
        api.rect(ctx, x, 440, 500, 150, themeColors.panel, themeColors.muted, 2);
        api.rect(ctx, x, 440, 500 * p, 150, colors[i], undefined, 0);
        if (reveal > 0) api.rect(ctx, x, 440, 500 * p * 0.6 * reveal, 150, themeColors.green, undefined, 0);
        drawConstructedText(
          ctx,
          api,
          (100 * p) + ' of 100 have input x',
          x + 250,
          680,
          32,
          themeColors.cyan,
          'center',
        );
        if (reveal === 1)
          drawConstructedText(
            ctx,
            api,
            (100 * p * 0.6) + ' of 100 have x and a hit',
            x + 250,
            790,
            35,
            themeColors.green,
            'center',
          );
      });
      drawConstructedText(
        ctx,
        api,
        'Hit rate among requests with x = 60% in both populations',
        960,
        930,
        34,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      drawConstructedHead(ctx, api, 'One joint distribution permits both factorizations');
      drawConstructedEquation(
        ctx,
        api,
        String.raw`P(X,Y)=P(X)P(Y\mid X)`,
        960,
        410,
        47,
        themeColors.blue,
      );
      if (f.started('joint-reverse')) {
        drawConstructedEquation(
          ctx,
          api,
          String.raw`P(X,Y)=P(Y)P(X\mid Y)`,
          960,
          620,
          47,
          themeColors.green,
        );
        drawConstructedArrow(ctx, api, 960, 470, 960, 545, themeColors.cyan);
      }
      if (f.started('joint-sample')) {
        drawConstructedBox(ctx, api, 'select component', 480, 835, 500, 100, themeColors.blue, 34);
        drawConstructedArrow(ctx, api, 770, 835, 1120, 835, themeColors.blue);
        drawConstructedBox(ctx, api, 'sample latency', 1400, 835, 500, 100, themeColors.pink, 34);
      }
      drawConstructedNote(
        ctx,
        api,
        'In the latency log, only the sampled time is observed.',
      );
    } else {
      drawConstructedHead(
        ctx,
        api,
        'One Gaussian centered at 30 ms',
      );
      const p = drawConstructedPlot(
        ctx,
        api,
        260,
        380,
        1120,
        460,
        [29.4, 30.6],
        [0, 2.2],
        'latency (ms)',
        'density per ms',
        [29.5, 30, 30.5],
        [0, 1, 2],
      );
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => gammaDensity(x, 30, 0.04),
        29.4,
        30.6,
        themeColors.blue,
        5,
      );
      if (f.started('density-interval')) {
        for (let i = 0; i < 50; i++) {
          const x = 29.9 + (i * 0.2) / 50,
            q = p.point(x, gammaDensity(x, 30, 0.04)),
            zero = p.point(x, 0);
          drawConstructedLine(ctx, api, q.x, q.y, zero.x, zero.y, themeColors.green, 4);
        }
        drawConstructedText(
          ctx,
          api,
          'area over an interval = probability',
          1460,
          620,
          29,
          themeColors.green,
          'center',
        );
      }
      drawConstructedText(
        ctx,
        api,
        'sd 0.2 ms · peak ' + gammaDensity(30, 30, 0.04).toFixed(3) + ' / ms',
        960,
        950,
        34,
        themeColors.yellow,
        'center',
      );
      if (f.started('density-interval')) drawConstructedNote(
        ctx,
        api,
        'Shaded interval: 29.9 to 30.1 ms',
      );
    }
  });
}
export default {
  id: 'generative-boundary',
  draw: drawGenerativeBoundary,
  cues: [
    'generative-boundary-0',
    'joint-populations',
    'generative-boundary-1',
    'joint-reverse',
    'joint-sample',
    'generative-boundary-2',
    'density-interval',
  ],
};
