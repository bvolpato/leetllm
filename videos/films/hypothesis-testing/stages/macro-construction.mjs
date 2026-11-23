import { macroTaskInterval, macroTaskResamples, macroTaskScores } from '../fixtures.mjs';
import { completedHypothesisResult, cueProgress, resultOrOperation } from '../model.mjs';
import {
  constructionBox,
  constructionCaption,
  constructionHeading,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawMacroConstruction(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    cp = (id, beat) => {
      checked(id);
      return cueProgress(state, id, beat);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'macro-construction-construction', () => {
    if (currentBeat === 0) {
      const ids = [
          'hyp-macro-score-zero',
          'hyp-macro-score-half',
          'hyp-macro-score-seven-ninths',
          'hyp-macro-score-forty-one',
        ],
        ready = ids.map((id) => completedHypothesisResult(state, id, 0));
      constructionText(
        ctx,
        api,
        'Each pool contains ten candidates. Green positions pass.',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      const scores = macroTaskScores.map((v, i) => (ready[i] ? v : 0));
      const gap = 120;
      const barWidth = 250;
      const left = 280;
      [0, 1, 2, 4].forEach((passes, i) => {
        const x = left + barWidth / 2 + i * (barWidth + gap);
        constructionText(ctx, api, 'Task ' + (i + 1), x, 385, 34, themeColors.ink, 'center');
        for (let c = 0; c < 10; c++)
          api.circle(
            ctx,
            x - 88 + (c % 5) * 44,
            452 + Math.floor(c / 5) * 43,
            16,
            c < passes ? themeColors.green : themeColors.muted,
          );
        constructionText(ctx, api, passes + ' passing', x, 575, 32, themeColors.green, 'center');
        if (ready[i])
          constructionText(
            ctx,
            api,
            'pass@5  ' + scores[i].toFixed(3),
            x,
            865,
            35,
            themeColors.cyan,
            'center',
          );
      });
      api.teaching.bars({
        x: left,
        y: 620,
        width: 4 * barWidth + 3 * gap,
        height: 165,
        gap,
        values: scores,
        color: themeColors.cyan,
        max: 1,
        showValues: false,
      });
      if (on('hyp-macro-mean', 0)) {
        const mean =
          macroTaskScores.reduce((total, score) => total + score, 0) / macroTaskScores.length;
        constructionText(
          ctx,
          api,
          'Four equal task weights     ·     Macro pass@5   ' + mean.toFixed(3),
          960,
          967,
          44,
          themeColors.cyan,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      const slots = 1 + Math.floor(4 * cp('macro-more-attempts', 1));
      constructionText(ctx, api, 'A different task population', 225, 320, 40);
      for (let row = 0; row < 2; row++) {
        const y = 478 + row * 205;
        const col = row === 0 ? themeColors.green : themeColors.muted;
        constructionText(
          ctx,
          api,
          row === 0 ? 'Half always pass' : 'Half always fail',
          225,
          y + 12,
          36,
          col,
        );
        for (let k = 0; k < slots; k++)
          constructionBox(
            ctx,
            api,
            row === 0 ? 'pass' : 'fail',
            740 + k * 190,
            y,
            158,
            95,
            col,
            33,
          );
      }
      constructionText(
        ctx,
        api,
        slots > 1 && !on('macro-extra-result', 1)
          ? 'Who did the extra tries help?'
          : 'Budget ' + slots + '     ·     Solved tasks  50%',
        960,
        857,
        43,
        themeColors.cyan,
        'center',
      );
      if (on('hyp-macro-pooling', 1))
        constructionText(
          ctx,
          api,
          'Pooling would give   1 − (1/2)⁵ = 96.875%',
          960,
          965,
          36,
          themeColors.pink,
          'center',
        );
    } else if (currentBeat === 2) {
      const q = cp('hyp-macro-resample', 2),
        count = q < 0.3 ? 0 : Math.min(256, Math.floor(((q - 0.3) / 0.7) * 256)),
        firstCount = Math.floor(Math.min(1, q / 0.3) * 4),
        current = macroTaskResamples[Math.min(255, count)],
        bins = Array(16).fill(0);
      for (const r of macroTaskResamples.slice(0, count))
        bins[Math.min(15, Math.floor(r.mean * 16))]++;
      constructionHeading(ctx, api, 'Enumerate 4⁴ ordered whole-task resamples');
      for (let i = 0; i < firstCount; i++) {
        const id = current.ids[i];
        constructionBox(
          ctx,
          api,
          'T' + (id + 1) + ' · ' + macroTaskScores[id].toFixed(3),
          440 + i * 350,
          380,
          290,
          80,
          themeColors.blue,
          28,
        );
      }
      api.teaching.bars({
        x: 280,
        y: 500,
        width: 1330,
        height: 270,
        values: bins,
        labels: bins.map((_, i) => (i % 4 ? '' : (i / 16).toFixed(2))),
        colors: bins.map(() => themeColors.cyan),
        max: 60,
        fontSize: 23,
        showValues: false,
      });
      constructionText(
        ctx,
        api,
        `${count}/256 means · ${firstCount === 4 ? 'current ' + current.mean.toFixed(6) : 'mean pending'}`,
        960,
        870,
        33,
        themeColors.cyan,
        'center',
      );
      if (on('hyp-macro-interval', 2))
        constructionText(
          ctx,
          api,
          `percentile endpoints ${macroTaskInterval[0].toFixed(6)} to ${macroTaskInterval[1].toFixed(6)}`,
          960,
          965,
          36,
          themeColors.yellow,
          'center',
        );
      constructionCaption(
        ctx,
        api,
        'Generated completions remain fixed; ordered indices resample tasks and preserve duplicate task weights.',
      );
    } else {
      constructionHeading(
        ctx,
        api,
        'Compare models with one paired task or cluster as the sampling unit',
      );
      for (let i = 0; i < 4; i++) {
        const x = 350 + i * 410;
        api.rect(ctx, x - 170, 360, 340, 430, 'transparent', themeColors.cyan, 2);
        constructionText(ctx, api, 'task T' + (i + 1), x, 420, 31, themeColors.cyan, 'center');
        constructionBox(ctx, api, 'A estimate', x, 545, 290, 85, themeColors.blue, 29);
        constructionBox(
          ctx,
          api,
          'B ' + macroTaskScores[i].toFixed(3),
          x,
          705,
          290,
          85,
          themeColors.green,
          29,
        );
      }
      constructionText(
        ctx,
        api,
        'Carry both estimates through each resample · related variants travel as clusters',
        960,
        940,
        31,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'A values are unspecified here; no matched model-lift estimate is invented from the separate B fixture.',
      );
    }
  });
}
export default {
  id: 'macro-construction',
  draw: drawMacroConstruction,
  cues: [
    'macro-construction-0',
    'hyp-macro-mean',
    'hyp-macro-score-zero',
    'hyp-macro-score-half',
    'hyp-macro-score-seven-ninths',
    'hyp-macro-score-forty-one',
    'macro-construction-1',
    'hyp-macro-pooling',
    'macro-more-attempts',
    'macro-extra-result',
    'macro-construction-2',
    'hyp-macro-resample',
    'hyp-macro-interval',
    'macro-construction-3',
  ],
};
