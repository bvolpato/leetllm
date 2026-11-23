import { FIXTURE_RERANK_SCORES } from '../fixtures.mjs';
import { LEXICAL_TOP_TWO, SECOND_LANE_UNION, rerankFixture } from '../selection.mjs';
import { TRACKS } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawVisualFocus,
} from '../defaults.mjs';
export function drawEvaluation(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS['evaluation'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  drawOriginalText(ctx, api, 'Same query · make + soup', 150, 225, 25, themeColors.cyan);
  {
    drawOriginalText(
      ctx,
      api,
      'Does the returned evidence answer the question?',
      960,
      280,
      36,
      themeColors.ink,
      'center',
    );
    const addition =
      beat > 1
        ? 1
        : api.focus
          ? api.focus.progress('evaluation-beat-2-focus-1', progress)
          : api.phase(progress, 0.1, 0.35);
    const unionArrived = beat > 1 || addition >= 0.65,
      combined = unionArrived ? SECOND_LANE_UNION : LEXICAL_TOP_TWO;
    const fusionKnown =
      beat > 1 ||
      (state.cues?.['evaluation-fuse-results']?.phase &&
        state.cues['evaluation-fuse-results'].phase !== 'before');
    const chosen = fusionKnown ? rerankFixture(SECOND_LANE_UNION) : combined;
    const relevantCards = snapshot.relevant.map((id, index) =>
      drawVisualFocus(ctx, api, 'evaluation-object-relevant-45', () =>
        drawOriginalCard(
          ctx,
          api,
          'evaluation',
          id + ' · relevant',
          170,
          385 + index * 122,
          490,
          82,
          themeColors.green,
          1,
          29,
        ),
      ),
    );
    drawVisualFocus(ctx, api, 'evaluation-ranked-result', () =>
      chosen.forEach((id, index) =>
        drawOriginalCard(
          ctx,
          api,
          'evaluation',
          id +
            ' · ' +
            (snapshot.relevant.includes(id) ? 'useful' : 'lunch menu') +
            (fusionKnown ? ' · ' + FIXTURE_RERANK_SCORES[id].toFixed(2) : ''),
          1180,
          350 + index * 104,
          560,
          78,
          snapshot.relevant.includes(id) ? themeColors.green : themeColors.pink,
          1,
          27,
        ),
      ),
    );
    drawOriginalText(
      ctx,
      api,
      fusionKnown ? 'Reranked results' : 'Selected by ' + snapshot.lane,
      960,
      325,
      30,
      themeColors.cyan,
      'center',
    );
    if (snapshot.lane === 'sparse')
      drawOriginalText(
        ctx,
        api,
        'Recall@2 = 0.5 · one of two useful passages retrieved',
        960,
        850,
        30,
        themeColors.yellow,
        'center',
      );
    else {
      const sourceKnown =
        beat > 1 ||
        (state.cues?.['evaluation-beat-2-focus-1']?.phase &&
          state.cues['evaluation-beat-2-focus-1'].phase !== 'before');
      const paraphrase = drawVisualFocus(
        ctx,
        api,
        'evaluation-object-cooking-paraphrase-d2-48',
        () =>
          drawOriginalCard(
            ctx,
            api,
            'evaluation',
            'cooking paraphrase · d2',
            150,
            730,
            450,
            82,
            themeColors.cyan,
            sourceKnown ? 1 : 0,
            27,
          ),
      );
      const union = drawVisualFocus(ctx, api, 'evaluation-candidate-union', () =>
        drawOriginalCard(
          ctx,
          api,
          'evaluation',
          'candidate union · ' + combined.join(', '),
          710,
          730,
          600,
          82,
          themeColors.blue,
          1,
          27,
        ),
      );
      if (sourceKnown)
        teaching.transfer({
          source: {
            shape: paraphrase,
            opacity: 1,
          },
          target: {
            shape: union,
            opacity: 1,
          },
          progress: addition,
          color: themeColors.cyan,
          particle: {
            radius: 7,
            fill: themeColors.yellow,
          },
          gap: 12,
        });
      if (fusionKnown)
        drawVisualFocus(ctx, api, 'evaluation-reranker', () => {
          const scorer = drawOriginalCard(
            ctx,
            api,
            'evaluation',
            'Reranker',
            1410,
            730,
            360,
            82,
            themeColors.green,
            1,
            27,
          );
          teaching.transfer({
            source: {
              shape: union,
              opacity: 1,
            },
            target: {
              shape: scorer,
              opacity: 1,
            },
            progress: 1,
            color: themeColors.green,
            gap: 12,
          });
        });
      drawOriginalText(
        ctx,
        api,
        fusionKnown
          ? 'Reranked top2: d1 + d2 · Recall@2 = 1.0'
          : 'Candidate-union recall = ' + (unionArrived ? '1.0' : '0.5'),
        960,
        895,
        29,
        themeColors.yellow,
        'center',
      );
    }
    void relevantCards;
    drawVisualFocus(
      ctx,
      api,
      'evaluation-equation-string-raw-mathrm-recall-k-frac-mathrm-relevant-ca-51',
      () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\mathrm{Recall@}K=\frac{|\mathrm{relevant}\cap\mathrm{retrieved}_K|}{|\mathrm{relevant}|}`,
          960,
          970,
          37,
          themeColors.ink,
        ),
    );
  }
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'evaluation-relevant',
    'evaluation-recall',
    'evaluation-beat-2-focus-1',
    'evaluation-fuse-results',
    'evaluation-beat-3-focus-1',
  ],
};
