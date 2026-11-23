import { clamp, mix, motion } from '../arithmetic.mjs';
import { searchMetrics } from '../model.mjs';
import { chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawLabeledMetrics(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-labeled-metrics-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-labeled-metrics-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-labeled-metrics-mechanism', () => {
    const gold = ['Policy', 'Exception'],
      repaired = currentBeat === 2 && done('both', 2),
      ranked = repaired ? gold : ['Policy', 'FAQ'],
      v = searchMetrics(ranked, gold, 2);
    chapterText(ctx, api, 'Gold identities: Policy + Exception', 170, 285, 33, themeColors.green);
    if (currentBeat === 0) {
      const q = prog('dedup', 0),
        move = clamp((q - 0.5) * 2);
      [
        ['Policy', 200, 0],
        ['Policy', 720, 1],
        ['FAQ', mix(1240, 720, move), 2],
      ].forEach(([name, x, i]) => {
        if (i === 1 && q >= 0.5) return;
        const alpha = i === 1 ? 1 - 2 * q : 1,
          y = i === 2 ? 390 + 160 * Math.sin(Math.PI * move) : 390;
        components.fade(alpha, () => {
          chapterRect(
            ctx,
            api,
            x,
            y,
            460,
            115,
            themeColors.panel,
            gold.includes(name) ? themeColors.green : themeColors.muted,
          );
          chapterText(
            ctx,
            api,
            name,
            x + 230,
            y + 70,
            29,
            gold.includes(name) ? themeColors.green : themeColors.muted,
            'center',
          );
        });
      });
      chapterText(
        ctx,
        api,
        'Repeated identity → no additional relevant hit',
        180,
        870,
        30,
        themeColors.yellow,
      );
    } else {
      ranked.forEach((name, i) => {
        const x = 200 + i * 720;
        chapterRect(
          ctx,
          api,
          x,
          365,
          620,
          115,
          themeColors.panel,
          gold.includes(name) ? themeColors.green : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          'rank ' + (i + 1) + ' · ' + name,
          x + 310,
          435,
          29,
          gold.includes(name) ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      chapterText(ctx, api, 'Observed gain', 200, 570, 29, themeColors.blue);
      chapterText(ctx, api, 'Ideal gain', 1050, 570, 29, themeColors.green);
      const n = currentBeat === 1 ? Math.ceil(prog('formula', 1) * 2) : 2;
      for (let i = 0; i < n; i++) {
        const observed = gold.includes(ranked[i]) ? 1 / Math.log2(i + 2) : 0,
          ideal = 1 / Math.log2(i + 2),
          y = 640 + i * 135;
        chapterText(
          ctx,
          api,
          (observed ? '1' : '0') + ' / log₂(' + (i + 2) + ') = ' + observed.toFixed(4),
          210,
          y,
          28,
          themeColors.yellow,
        );
        chapterRect(ctx, api, 210, y + 20, observed * 500, 35, themeColors.blue);
        chapterText(
          ctx,
          api,
          '1 / log₂(' + (i + 2) + ') = ' + ideal.toFixed(4),
          1050,
          y,
          28,
          themeColors.green,
        );
        chapterRect(ctx, api, 1050, y + 20, ideal * 500, 35, themeColors.green);
      }
      if (currentBeat === 1 && done('formula', 1)) {
        chapterText(ctx, api, 'DCG = ' + v.dcg.toFixed(4), 210, 925, 31, themeColors.blue);
        chapterText(
          ctx,
          api,
          'Ideal DCG = ' + v.ideal.toFixed(4),
          1050,
          925,
          31,
          themeColors.green,
        );
      }
      if (currentBeat === 2 && done('half', 2)) {
        chapterText(ctx, api, 'Recall = ' + v.recall.toFixed(4), 210, 925, 33, themeColors.green);
        chapterText(ctx, api, 'nDCG = ' + v.ndcg.toFixed(4), 1050, 925, 33, themeColors.yellow);
      }
    }
    if (currentBeat === 0)
      chapterFooter(ctx, api, 'An empty set of relevant documents leaves recall undefined.');
  });
}
export default {
  id: 'labeled-metrics',
  draw: drawLabeledMetrics,
  cues: [
    'se-labeled-metrics-0',
    'se-labeled-metrics-dedup',
    'se-labeled-metrics-1',
    'se-labeled-metrics-formula',
    'se-labeled-metrics-2',
    'se-labeled-metrics-half',
    'se-labeled-metrics-both',
  ],
};
