import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawEvaluationScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-evaluation-scope-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('evaluation-scope-mechanism', () => {
    if (currentBeat === 0) {
      drawText(ctx, api, 'STS pair relatedness', 520, 330, 35, themeColors.blue);
      drawPill(ctx, api, 'build failed / test failed', 520, 500, 760, themeColors.blue);
      drawPill(ctx, api, 'build failed / password reset', 520, 680, 760, themeColors.muted);
      if (resultComplete('sts')) {
        drawText(ctx, api, '4.5', 1100, 512, 40, themeColors.cyan);
        drawText(ctx, api, '1.2', 1100, 692, 40, themeColors.cyan);
      }
      if (resultComplete('mteb'))
        drawText(
          ctx,
          api,
          'Original MTEB: 33 models / 58 datasets / 8 categories',
          960,
          935,
          31,
          themeColors.yellow,
        );
      drawNote(ctx, api, 'Human relatedness ranks are not operational answer-support labels');
    } else if (currentBeat === 1) {
      const vals = [15, 12, 11, 10, 4, 3, 2, 1],
        labels = ['retrieval', 'classify', 'cluster', 'STS', 'rerank', 'pair', 'bitext', 'summary'];
      vals.forEach((v, i) => {
        const x = 220 + i * 205;
        drawRectangle(ctx, api, x, 790 - v * 24, 145, v * 24, themeColors.blue);
        drawText(ctx, api, labels[i], x + 72, 850, 24, themeColors.muted);
        if (resultComplete('categories'))
          drawText(ctx, api, v, x + 72, 740 - v * 24, 30, themeColors.cyan);
      });
      if (resultComplete('languages'))
        drawText(
          ctx,
          api,
          '2025 MMTEB: >500 tasks / >250 languages',
          960,
          950,
          34,
          themeColors.yellow,
        );
      drawNote(
        ctx,
        api,
        'Historical snapshots and named current benchmark subsets have different scopes',
      );
    } else {
      const fields = ['revision', 'split', 'language', 'domain', 'length', 'format'];
      fields.forEach((v, i) =>
        drawPill(
          ctx,
          api,
          v,
          460 + (i % 3) * 500,
          430 + Math.floor(i / 3) * 190,
          410,
          themeColors.blue,
        ),
      );
      if (resultComplete('truncate'))
        drawText(
          ctx,
          api,
          'Truncated evidence is absent before pooling begins',
          960,
          925,
          34,
          themeColors.pink,
        );
      drawNote(
        ctx,
        api,
        'Sentence-Transformers encodes/trains · FAISS searches · judgments establish retrieval quality',
      );
    }
  });
}
export default {
  id: 'evaluation-scope',
  draw: drawEvaluationScope,
  cues: [
    'cl-evaluation-scope-sts',
    'cl-evaluation-scope-mteb',
    'cl-evaluation-scope-categories',
    'cl-evaluation-scope-languages',
    'cl-evaluation-scope-truncate',
  ],
};
