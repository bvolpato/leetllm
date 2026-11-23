import { sampleModel } from '../model.mjs';
import { originalCard, originalMath, originalText } from '../defaults.mjs';
const words = ['Birds', 'sing', 'at', 'dawn'];
export function drawLoss(ctx, scene, state, api) {
  return api.focus.target('hf-loss-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('loss', state),
      currentBeat = modelState.b;
    {
      const trace = modelState,
        width = 340,
        start = 275;
      originalText(ctx, api, 'Birds sing at dawn', 960, 275, 60, themeColors.ink, 'center');
      originalText(ctx, api, 'Input', 135, 410, 29, themeColors.blue);
      originalText(ctx, api, 'Labels', 135, 600, 29, themeColors.cyan);
      for (let i = 0; i < 4; i++) {
        api.focus.target(i === 2 ? 'loss-input-two' : 'loss-inputs', () =>
          originalCard(
            ctx,
            api,
            trace.tokens[i] + ' · ' + words[trace.tokens[i]],
            start + i * width,
            350,
            300,
            themeColors.blue,
            85,
          ),
        );
        api.focus.target(i === 2 ? 'loss-label-two' : 'loss-labels', () =>
          originalCard(
            ctx,
            api,
            trace.ignored && i === 2 ? '−100 · ignore' : words[trace.tokens[i]],
            start + i * width,
            540,
            300,
            trace.ignored && i === 2 ? themeColors.pink : themeColors.cyan,
            85,
          ),
        );
      }
      trace.terms.forEach((term, i) => {
        const x = start + i * width + 150,
          targetX = start + (i + 1) * width + 150,
          color = term.active ? themeColors.green : themeColors.muted;
        if (i < trace.links)
          api.focus.target(term.active ? 'loss-active-alignments' : 'loss-removed-alignment', () =>
            api.arrow(ctx, x, 450, targetX, 525, color, 4),
          );
        if (!term.visible) return;
        api.focus.target(term.active ? 'loss-surviving-terms' : 'loss-removed-term', () => {
          originalCard(
            ctx,
            api,
            words[term.position] + ' → ' + words[term.target],
            190 + i * 575,
            715,
            500,
            color,
            80,
          );
          api.math(
            ctx,
            term.active
              ? String.raw`-\ln(${term.probability})\approx${term.value.toFixed(4)}`
              : '\\mathrm{Term\\ excluded}',
            440 + i * 575,
            850,
            32,
            color,
            'center',
          );
        });
      });
      if (trace.mean !== null) {
        const changed = currentBeat === 1 && trace.dropped;
        api.focus.target('loss-active-count', () =>
          originalCard(
            ctx,
            api,
            (trace.terms.every((term) => term.visible) ? 'Active targets: ' : 'Included terms: ') +
              trace.count,
            1450,
            925,
            320,
            themeColors.yellow,
            75,
          ),
        );
        api.focus.target('loss-mean', () =>
          teaching.changeCue(
            {
              x: 300,
              y: 910,
              width: 1040,
              height: 100,
              from: 3,
              to: trace.count,
              progress: 1,
              emphasis: changed ? 0.55 : 0,
              color: themeColors.yellow,
            },
            () =>
              originalMath(
                ctx,
                api,
                String.raw`\frac{${trace.total.toFixed(4)}}{${trace.count}}\approx${trace.mean.toFixed(4)}`,
                820,
                965,
                44,
              ),
          ),
        );
      }
      if (currentBeat === 2)
        originalText(
          ctx,
          api,
          '“at” stays in the input for the prediction of “dawn”',
          960,
          1040,
          27,
          themeColors.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'loss',
  draw: drawLoss,
  cues: [
    'loss-beat-1-focus-1',
    'loss-beat-1-focus-2',
    'hf-loss-0',
    'loss-beat-2-focus-1',
    'loss-ignore-third-label',
    'loss-beat-2-focus-2',
    'hf-loss-1',
    'loss-beat-3-focus-1',
    'loss-beat-3-focus-2',
    'hf-loss-2',
  ],
};
