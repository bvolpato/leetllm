import {
  drawConstructionArrow,
  drawConstructionEquation,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawPerplexity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'perplexity'}-voice-${currentBeat + 1}`);
  api.focus.target('perplexity-construction', () => {
    if (currentBeat === 0) {
      drawConstructionText(
        ctx,
        api,
        'Supplied conditional probabilities · same scorer and tokenizer',
        160,
        300,
        31,
        themeColors.cyan,
      );
      const values = [0.5, 0.25],
        heights = values.map((x) => -Math.log(x)),
        steps = Math.min(4, Math.floor(v * 5));
      values.forEach((value, i) => {
        const x = 290 + i * 430;
        drawConstructionText(ctx, api, 'token ' + (i + 1), x, 400, 30, themeColors.muted, 'center');
        drawConstructionText(ctx, api, 'p = ' + value, x, 490, 42, themeColors.blue, 'center');
        if (steps > 0) {
          api.rect(
            ctx,
            x - 100,
            770 - heights[i] * 145,
            200,
            heights[i] * 145,
            themeColors.cyan,
            undefined,
            0,
          );
          drawConstructionText(
            ctx,
            api,
            '−ln p = ' + heights[i].toFixed(3),
            x,
            850,
            29,
            themeColors.cyan,
            'center',
          );
        }
      });
      if (steps > 1)
        drawConstructionEquation(ctx, api, '\\frac{-\\ln0.5-\\ln0.25}{2}', 1340, 510, 52);
      if (steps > 2)
        drawConstructionText(
          ctx,
          api,
          'mean NLL ≈ 1.040',
          1340,
          660,
          34,
          themeColors.yellow,
          'center',
        );
      if (done('ppl-answer'))
        drawConstructionEquation(
          ctx,
          api,
          '\\exp(1.040)\\approx2.83',
          1340,
          810,
          50,
          themeColors.green,
        );
      drawConstructionNote(
        ctx,
        api,
        'Perplexity is the inverse geometric mean of these scored token probabilities.',
      );
    } else if (currentBeat === 1) {
      drawConstructionText(
        ctx,
        api,
        'Hold the scorer and tokenization fixed',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionSheet(
        ctx,
        api,
        'incident log',
        'quorum lost · shard=7 · rollback pending',
        160,
        420,
        1590,
        130,
        themeColors.blue,
      );
      drawConstructionSheet(
        ctx,
        api,
        'boilerplate',
        'Welcome. Welcome. Welcome. Welcome.',
        160,
        660,
        1590,
        130,
        themeColors.muted,
      );
      if (drawConstructionP(ctx, api, 'ppl-domain') > 0) {
        drawConstructionText(
          ctx,
          api,
          'may be unfamiliar',
          1500,
          580,
          30,
          themeColors.yellow,
          'center',
        );
        drawConstructionText(
          ctx,
          api,
          'may be predictable',
          1500,
          820,
          30,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionNote(ctx, api, 'Which passage would help you diagnose an incident?');
    } else {
      drawConstructionText(
        ctx,
        api,
        'Which details survive the rewrite?',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionSheet(
        ctx,
        api,
        'Incident log',
        'quorum lost · shard=7 · rollback pending',
        160,
        405,
        1590,
        130,
        themeColors.blue,
      );
      if (drawConstructionP(ctx, api, 'perplexity-b3') > 0) {
        drawConstructionArrow(ctx, api, 960, 555, 960, 615, themeColors.yellow);
        drawConstructionSheet(
          ctx,
          api,
          'Proposed rewrite',
          'The system had a problem.',
          160,
          640,
          1590,
          120,
          themeColors.yellow,
        );
      }
      if (v > 0) {
        drawConstructionText(ctx, api, 'Removed: shard identity 7', 230, 840, 31, themeColors.pink);
      }
      if (v === 1) {
        drawConstructionText(
          ctx,
          api,
          'Removed: rollback is pending',
          1010,
          840,
          31,
          themeColors.pink,
        );
      }
    }
  });
}
export default {
  id: 'perplexity',
  draw: drawPerplexity,
  cues: [
    'perplexity-b1',
    'perplexity-voice-1',
    'ppl-answer',
    'perplexity-b2',
    'perplexity-voice-2',
    'ppl-domain',
    'perplexity-b3',
    'perplexity-voice-3',
  ],
};
