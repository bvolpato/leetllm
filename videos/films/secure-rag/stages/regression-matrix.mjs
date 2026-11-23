import { drawFooter, drawHeading, drawRectangle, drawTag, drawText } from '../defaults.mjs';
export function drawRegressionMatrix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-regression-matrix-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-regression-matrix-mechanism', () => {
    const mutations = ['tenant', 'expiry', 'deletion', 'membership', 'policy outage'],
      sinks = ['returned', 'reranker', 'judge', 'prompt', 'cache', 'trace', 'response'];
    drawHeading(ctx, api, 'Follow the SAME protected source into every destination');
    for (let i = 0; i < mutations.length; i++) {
      drawText(ctx, api, mutations[i], 170, 425 + i * 90, 26, themeColors.yellow);
      for (let j = 0; j < sinks.length; j++) {
        const x = 440 + j * 185,
          y = 375 + i * 90,
          active = Q('rows', 0) * 5 >= i + 1 && Q('sinks', 0) * 7 >= j + 1;
        drawRectangle(ctx, api, x, y, 140, 60, active ? themeColors.yellow : themeColors.muted);
        if (active)
          drawText(ctx, api, 'expect ∅', x + 70, y + 39, 22, themeColors.yellow, 'center');
      }
    }
    sinks.forEach((v, i) =>
      drawText(ctx, api, v, 510 + i * 185, 335, 24, themeColors.blue, 'center'),
    );
    if (currentBeat === 1) {
      if (resultComplete('irrelevant', 1))
        drawTag(
          ctx,
          api,
          'Allowed but irrelevant',
          'eligible / usefulness fails',
          170,
          865,
          760,
          themeColors.yellow,
        );
      if (resultComplete('upload', 1))
        drawTag(
          ctx,
          api,
          'Allowed text asks upload',
          'action gate HOLDS',
          1050,
          865,
          690,
          themeColors.pink,
        );
    }
    drawFooter(
      ctx,
      api,
      'Required observations only; no real endpoint results. Measure revocation and authorized recall separately.',
    );
  });
}
export default {
  id: 'regression-matrix',
  draw: drawRegressionMatrix,
  cues: [
    'sr-regression-matrix-0',
    'sr-regression-matrix-rows',
    'sr-regression-matrix-sinks',
    'sr-regression-matrix-1',
    'sr-regression-matrix-irrelevant',
    'sr-regression-matrix-upload',
  ],
};
