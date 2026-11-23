import { completed, opProgress } from '../construction.mjs';
import { scalarReverseTrace } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawReverseTrace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'reverse-trace'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-reverse-trace-result', fn);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 2
        ? 'Resume the saved state with the next random draw'
        : 'Each sampler output becomes the next predictor input',
    );
    const r = scalarReverseTrace();
    result(() => {
      if (currentBeat < 2) {
        const show = [
          currentBeat > 0 || done('trace-first'),
          currentBeat > 0 && done('trace-second'),
          currentBeat > 0 && done('trace-final'),
        ];
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Step', 'Input', 'Predicted eps', 'Mean', 'Draw z', 'Next state'],
            ...r.rows.map((v, i) => {
              const hasInput = i === 0 || show[i - 1];
              const working = hasInput && (i === 0 || currentBeat === 1);
              return [
                v.step,
                hasInput ? v.input.toFixed(3) : '?',
                working ? v.prediction.toFixed(3) : '?',
                working ? v.mean.toFixed(3) : '?',
                working ? v.draw.toFixed(3) : '?',
                show[i] ? v.next.toFixed(3) : '?',
              ];
            }),
          ],
          150,
          390,
          1620,
          340,
          themeColors.cyan,
          29,
        );
        drawConstructionEquation(
          ctx,
          api,
          String.raw`\mu=(x-\beta\hat\epsilon/\sqrt{1-\bar\alpha})/\sqrt\alpha`,
          960,
          875,
          42,
        );
        drawConstructionFooter(
          ctx,
          api,
          'Example predictor: ε̂ = 0.45x + 0.02t     ·     Next state = mean + √β × draw',
        );
      } else {
        drawConstructionBox(
          ctx,
          api,
          'Saved x = ' + r.saved.toFixed(6) + ' · next step 1',
          420,
          390,
          1080,
          themeColors.blue,
          100,
          32,
        );
        drawConstructionBox(
          ctx,
          api,
          'Restored generator',
          170,
          625,
          700,
          themeColors.cyan,
          100,
          33,
        );
        drawConstructionBox(ctx, api, 'Reset seed 7', 1050, 625, 700, themeColors.pink, 100, 33);
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Next Gaussian', done('trace-resume') ? '0.511432' : '?', '−0.255880'],
            [
              'Next state',
              done('trace-resume') ? r.restoredNext.toFixed(6) : '?',
              done('trace-resume') ? r.resetNext.toFixed(6) : '?',
            ],
          ],
          170,
          785,
          1580,
          180,
          themeColors.cyan,
          29,
        );
      }
    });
    return;
  }
}
export default {
  id: 'reverse-trace',
  draw: drawReverseTrace,
  cues: [
    'df-reverse-trace-0',
    'df-trace-first',
    'df-reverse-trace-1',
    'df-trace-second',
    'df-trace-final',
    'df-reverse-trace-2',
    'df-trace-resume',
  ],
};
