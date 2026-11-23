import { extendedFrame } from '../construction.mjs';
import { extendedLine, extendedNote, extendedText } from '../defaults.mjs';
export function drawEvaluationLimits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('evaluation-limits', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('evaluation-limits-operation', () => {
    if (currentBeat === 0) {
      extendedText(
        ctx,
        api,
        'Question answering on Wikipedia',
        960,
        280,
        34,
        themeColors.yellow,
        'center',
      );
      const settings = [
        ['Corpus', 'Wikipedia / Natural Questions'],
        ['Retriever', 'SPLADE'],
        ['Generator', 'Ministral-8B-Instruct-2410'],
        ['Chunk size S', '50…500 tokens'],
        ['Overlap O', '0% / 20%'],
        ['Retrieved budget C', '500…10000 generator tokens'],
      ];
      settings.forEach(([name, value], i) => {
        const y = 400 + i * 85;
        extendedText(ctx, api, name, 250, y, 28, themeColors.cyan);
        extendedText(ctx, api, value, 860, y, 29, themeColors.ink);
      });
      extendedNote(
        ctx,
        api,
        'Bennani and Moslonka (2026)',
      );
    } else if (currentBeat === 1) {
      const axes = [
        {
          name: 'Chunk size S',
          min: 50,
          max: 500,
          y: 450,
          color: themeColors.blue,
        },
        {
          name: 'Retrieved context C',
          min: 500,
          max: 10000,
          y: 735,
          color: themeColors.green,
        },
      ];
      axes.forEach((row) => {
        extendedText(ctx, api, row.name, 200, row.y, 30, row.color);
        extendedLine(ctx, api, 650, row.y - 10, 1660, row.y - 10, row.color, 3);
        extendedText(ctx, api, row.min, 650, row.y + 45, 26, row.color, 'center');
        extendedText(ctx, api, row.max, 1660, row.y + 45, 26, row.color, 'center');
        if (row.name.includes('context') && begun('study-context-five')) {
          const x = 650 + (1010 * (5000 - 500)) / (10000 - 500);
          extendedLine(ctx, api, x, row.y - 40, x, row.y + 15, themeColors.yellow, 4);
          extendedText(ctx, api, '~5000', x, row.y - 65, 32, themeColors.yellow, 'center');
        }
      });
      if (begun('study-context-five')) extendedText(
        ctx,
        api,
        'Sentence ≈ semantic up to ~5k retrieved-context tokens',
        960,
        925,
        34,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Each ruler measures a different part of the retrieval system.',
      );
    } else {
      extendedText(
        ctx,
        api,
        'Scoring an example answer',
        960,
        280,
        31,
        themeColors.muted,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Reference: Maya    Candidate: MAYA.',
        960,
        395,
        38,
        themeColors.ink,
        'center',
      );
      const normalized = 'MAYA.'.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const metrics = [
        ['Semantic match', 'BERTScore', 'requires its scoring model'],
        ['Text match', 'Exact match', 'normalize → ' + normalized + ' = maya'],
        ['Abstention', 'NONE indicator', 'MAYA. ≠ NONE'],
      ];
      metrics.forEach(([label, metric, result], i) => {
        const x = 440 + i * 520;
        extendedText(ctx, api, label, x, 550, 31, colors[i], 'center');
        extendedText(ctx, api, metric, x, 660, 35, colors[i], 'center');
        extendedText(ctx, api, result, x, 810, 27, colors[i], 'center');
      });
      extendedNote(
        ctx,
        api,
        'Score the answer and its citations. Report uncertainty across questions.',
      );
    }
  });
}
export default {
  id: 'evaluation-limits',
  draw: drawEvaluationLimits,
  cues: ['evaluation-limits-0', 'evaluation-limits-1', 'study-context-five', 'evaluation-limits-2'],
};
