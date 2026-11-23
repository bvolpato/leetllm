import { bootstrapMetricAccept } from '../model.mjs';
import {
  cueComplete,
  cueProgress,
  detailNote,
  detailPanel,
  detailText,
  progressArrow,
} from '../defaults.mjs';
export function drawOptimizerFamilies(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('optimizer-families-mechanism', () => {
    if (currentBeat === 0 && cueProgress(ctx, api, 'threshold-branch')) {
      detailText(ctx, api, 'Zero or missing threshold', 960, 285, 50, themeColors.ink);
      detailText(ctx, api, 'Python checks bool(score)', 960, 426, 43, themeColors.yellow);
      const showResult = cueComplete(ctx, api, 'truthy-values');
      for (const [i, score] of [0.5, -0.2, NaN].entries()) {
        const x = 435 + i * 525;
        detailText(ctx, api, String(score), x, 620, 65, themeColors.blue);
        const admitted = bootstrapMetricAccept(score, 0);
        detailText(ctx, api, showResult ? (admitted ? 'admit' : 'reject') : '?', x, 770, 48, showResult ? themeColors.cyan : themeColors.muted);
      }
    } else if (currentBeat === 0) {
      detailText(
        ctx,
        api,
        'Teacher answering the deployment request',
        960,
        285,
        43,
        themeColors.ink,
      );
      detailText(ctx, api, 'Step 1 · Read the approval', 510, 450, 36, themeColors.blue);
      detailText(ctx, api, 'Step 2 · Propose the final pair', 1410, 450, 36, themeColors.cyan);
      if (cueProgress(ctx, api, 'trace-intermediate')) {
        detailPanel(ctx, api, '“The approval covers deployment.”', 510, 550, themeColors.pink, 780);
        detailText(ctx, api, 'Record actually permits rollback.', 510, 690, 38, themeColors.pink);
        detailPanel(ctx, api, 'ABSTAIN · empty ID', 1410, 550, themeColors.cyan, 740);
      }
      if (cueComplete(ctx, api, 'final-pair')) {
        detailText(ctx, api, 'Final-pair score: 1 / 1', 1410, 690, 42, themeColors.green);
        detailText(
          ctx,
          api,
          'The recorded demonstration can include both steps.',
          960,
          865,
          43,
          themeColors.yellow,
        );
      }
    } else if (currentBeat === 1) {
      detailText(ctx, api, 'Same two traces · constant score 0.5', 960, 285, 50, themeColors.ink);
      const thresholds = [0, 1];
      const scores = [0.5, 0.5];
      for (const [i, threshold] of thresholds.entries()) {
        const y = 470 + i * 175;
        const revealed = cueComplete(ctx, api, i ? 'full-reject' : 'half-admit');
        const retained = scores.filter((score) => bootstrapMetricAccept(score, threshold)).length;
        detailText(
          ctx,
          api,
          i ? 'Threshold = 1' : 'Threshold = 0 or None',
          385,
          y,
          41,
          themeColors.blue,
        );
        detailText(ctx, api, i ? 'score ≥ 1' : 'bool(score)', 970, y, 47, themeColors.yellow);
        detailText(
          ctx,
          api,
          revealed ? retained + ' / 2 kept' : '? / 2 kept',
          1510,
          y,
          53,
          revealed ? themeColors.cyan : themeColors.muted,
        );
      }
      if (cueComplete(ctx, api, 'no-metric'))
        detailText(
          ctx,
          api,
          'No metric: successful teacher calls pass unchecked.',
          960,
          920,
          34,
          themeColors.pink,
        );
    } else if (currentBeat === 2) {
      detailPanel(
        ctx,
        api,
        'Same program · model weights stay fixed',
        960,
        285,
        themeColors.blue,
        1500,
      );
      const rows = [
        ['Bootstrap Random Search', 'demo subset A ↔ demo subset B', 'subset-search'],
        ['COPRO', 'instruction / output prefix proposals', 'copro-search'],
        ['MIPROv2', 'joint instruction × demo choices per predictor', 'mipro-search'],
      ];
      rows.forEach(([name, what, id], i) => {
        const y = 470 + i * 175;
        detailPanel(
          ctx,
          api,
          name,
          475,
          y,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          670,
        );
        if (cueProgress(ctx, api, id))
          detailText(
            ctx,
            api,
            what,
            1320,
            y + 10,
            29,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          );
      });
      if (cueComplete(ctx, api, 'search-space'))
        detailText(
          ctx,
          api,
          'Selection evidence is development data; it is not a final holdout',
          960,
          945,
          30,
          themeColors.pink,
        );
    } else {
      detailText(ctx, api, 'GEPA execution-feedback adapter', 960, 275, 36, themeColors.blue);
      const args = ['gold', 'prediction', 'trace', 'predictor name', 'predictor trace'];
      args.forEach((v, i) => {
        if (cueProgress(ctx, api, 'gepa-inputs') > i / 5)
          detailPanel(
            ctx,
            api,
            v,
            260 + i * 350,
            430,
            [
              themeColors.blue,
              themeColors.cyan,
              themeColors.yellow,
              themeColors.blue,
              themeColors.pink,
            ][i],
            305,
          );
      });
      detailPanel(
        ctx,
        api,
        'Existing metric: gold, prediction, trace',
        960,
        640,
        themeColors.yellow,
        1450,
      );
      if (cueComplete(ctx, api, 'gepa-feedback')) {
        progressArrow(ctx, api, 960, 500, 960, 575, themeColors.cyan);
        detailText(
          ctx,
          api,
          'Adapter → score + feedback for this predictor',
          960,
          790,
          31,
          themeColors.cyan,
        );
      }
      if (cueProgress(ctx, api, 'gepa-revision'))
        detailText(
          ctx,
          api,
          'Feedback: “Check which target the approval names.”',
          960,
          925,
          31,
          themeColors.green,
        );
    }
    detailNote(ctx, api, 'DSPy 3.4.0 · local acceptance probe and illustrated search mechanisms');
  });
  return;
}
export default {
  id: 'optimizer-families',
  draw: drawOptimizerFamilies,
  cues: [
    'threshold-branch',
    'trace-intermediate',
    'final-pair',
    'half-admit',
    'full-reject',
    'truthy-values',
    'no-metric',
    'search-space',
    'subset-search',
    'copro-search',
    'mipro-search',
    'gepa-feedback',
    'gepa-inputs',
    'gepa-revision',
  ],
};
