import { clamp } from '../arithmetic.mjs';
import { complete, sentence } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawReduce(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('reduce', state),
    currentBeat = modelState.b;
  {
    const reduceP = sentence(state, 'reduce', 0, 2),
      first = currentBeat > 0 || reduceP >= 0.2,
      second = currentBeat > 0 || reduceP >= 0.55,
      ready = currentBeat > 0 || reduceP === 1;
    const a = api.focus.target('reduce-rank-0-gradient-1', () =>
        drawOriginalCard(ctx, api, 'Rank 0 · gradient 1', 180, 350, 540, themeColors.blue),
      ),
      z = drawOriginalCard(ctx, api, 'Rank 1 · gradient 3', 1200, 350, 540, themeColors.pink);
    const mean = api.focus.target(
      'reduce-ready-reduced-mean-2-second-sum-1-3-4-first-partial-sum-1-await-both',
      () =>
        drawOriginalCard(
          ctx,
          api,
          ready
            ? 'Reduced mean = 2'
            : second
              ? 'Sum = 1 + 3 = 4'
              : first
                ? 'Partial sum = 1'
                : 'Await both contributions',
          650,
          590,
          620,
          ready ? themeColors.cyan : themeColors.muted,
          110,
        ),
    );
    const sendP = (node, start) =>
      teaching.transfer({
        source: {
          shape: node,
          opacity: 1,
        },
        target: {
          shape: mean,
          opacity: 1,
        },
        progress: currentBeat ? 1 : clamp((reduceP - start) / 0.35),
        color: start < 0.2 ? themeColors.blue : themeColors.pink,
        particle: {
          radius: 9,
          fill: start < 0.2 ? themeColors.blue : themeColors.pink,
        },
      });
    sendP(a, 0);
    sendP(z, 0.4);
    if (second)
      drawOriginalEquation(
        ctx,
        api,
        ready
          ? String.raw`\bar g=\frac{1+3}{2}=2`
          : String.raw`\text{divide the complete sum by two ranks}`,
        960,
        775,
        42,
        themeColors.cyan,
      );
    if (currentBeat > 0) {
      const squareProgress =
          currentBeat > 1
            ? 1
            : api.focus.progress(
                'reduce-square-operation',
                Math.max(0, Math.min(1, modelState.q / 0.45)),
              ),
        correct = 4 * squareProgress,
        wrong = 5 * squareProgress;
      api.focus.target('reduce-squared-quantities', () => {
        drawOriginalText(
          ctx,
          api,
          'Square the reduced mean',
          480,
          835,
          28,
          themeColors.green,
          'center',
        );
        drawOriginalText(
          ctx,
          api,
          'Average separately squared gradients',
          1390,
          835,
          28,
          themeColors.pink,
          'center',
        );
        api.rect(
          ctx,
          260,
          865,
          Math.max(0.01, (correct / 5) * 460),
          48,
          themeColors.green,
          undefined,
          0,
        );
        api.rect(
          ctx,
          1160,
          865,
          Math.max(0.01, (wrong / 5) * 460),
          48,
          themeColors.pink,
          undefined,
          0,
        );
        if (squareProgress === 1) {
          drawOriginalEquation(ctx, api, String.raw`2^2=4`, 520, 970, 40, themeColors.green);
          drawOriginalEquation(
            ctx,
            api,
            String.raw`\frac{1^2+3^2}{2}=5`,
            1390,
            970,
            40,
            themeColors.pink,
          );
        }
      });
    } else
      drawOriginalText(
        ctx,
        api,
        'The same parameter receives both rank contributions before its moment update',
        960,
        970,
        29,
        themeColors.muted,
        'center',
      );
    if (currentBeat === 2)
      api.focus.target('reduce-adam-result', () =>
        drawOriginalText(
          ctx,
          api,
          complete(state, 'reduce', 2, 0)
            ? `Owner R0 · Adam · rate 0.01 · w ≈ ${modelState.update[0].toFixed(6)} · m = ${modelState.update[1].toFixed(3)} · v = ${modelState.update[2].toFixed(3)}`
            : 'Owner R0 · Adam · rate 0.01 · update pending',
          960,
          1045,
          25,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'reduce',
  draw: drawReduce,
  cues: [
    'reduce-beat-1-focus-1',
    'reduce-beat-1-focus-2',
    'ds-reduce-b0-s0',
    'ds-reduce-b0-s1',
    'ds-reduce-b0-s2',
    'ds-reduce-b0-s3',
    'reduce-square-operation',
    'reduce-square-comparison',
    'ds-reduce-b1-s0',
    'ds-reduce-b1-s1',
    'ds-reduce-b1-s2',
    'ds-reduce-b1-s3',
    'reduce-reduced-adam-result',
    'ds-reduce-b2-s0',
    'ds-reduce-b2-s1',
    'ds-reduce-b2-s2',
    'ds-reduce-b2-s3',
  ],
};
