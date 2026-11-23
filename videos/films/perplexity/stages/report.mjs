import { spokenCue } from '../construction.mjs';
import { ppl, total } from '../fixtures.mjs';
import { drawExtendedBox, drawExtendedText, drawExtendedTitle } from '../defaults.mjs';
export function drawReport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (id) => spokenCue(scene, state, id);
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, '“The cat sat”  →  on  ·  the  ·  mat');
      api.focus.target('report-ledger', () => {
        drawExtendedBox(
          ctx,
          api,
          'Total loss ≈ ' + total.toFixed(3) + ' nats',
          260,
          430,
          650,
          100,
          themeColors.blue,
        );
        drawExtendedBox(ctx, api, 'Valid targets 3', 1110, 430, 500, 100, themeColors.green);
        api.arrow(ctx, 960, 560, 960, 670, themeColors.muted, 3);
        drawExtendedText(
          ctx,
          api,
          cue('report-recover').phase === 'after'
            ? 'exp(' + total.toFixed(3) + ' / 3) ≈ ' + ppl.toFixed(2)
            : 'Perplexity = ?',
          960,
          770,
          43,
          themeColors.yellow,
          'center',
        );
      });
      drawExtendedText(
        ctx,
        api,
        'Checkpoint  ·  Corpus revision  ·  Tokenizer and normalization  ·  Context, stride and masks',
        960,
        940,
        29,
        themeColors.muted,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'Keep the overlap audit with the score.',
        960,
        1030,
        30,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'What can you recover from each report?');
      const rows = [
        ['count = true, 1.5 or −1', 'invalid target count'],
        ['count = 0', 'no defined mean'],
        ['score = NaN', 'broken computation'],
        ['observed probability = 0', 'infinite loss'],
        ['finite loss = 1000', 'keep loss if exp overflows'],
      ];
      api.focus.target('bad-reports', () =>
        rows.forEach(([v, why], i) => {
          const y = 350 + i * 135;
          drawExtendedBox(
            ctx,
            api,
            v,
            220,
            y,
            640,
            85,
            i === 4 ? themeColors.yellow : themeColors.pink,
          );
          api.arrow(ctx, 900, y + 42, 1080, y + 42, themeColors.muted, 2);
          drawExtendedBox(
            ctx,
            api,
            why,
            1120,
            y,
            590,
            85,
            i === 4 ? themeColors.yellow : themeColors.pink,
          );
        }),
      );
    } else if (currentBeat === 2) {
      drawExtendedTitle(ctx, api, 'Keep paired document losses and source-group identities');
      const groups = [
        ['source A', ['doc1', 'doc2'], themeColors.blue],
        ['source B', ['doc3'], themeColors.cyan],
        ['source C', ['doc4', 'doc5'], themeColors.pink],
      ];
      groups.forEach(([name, docs, col], i) => {
        const x = 200 + i * 560;
        api.rect(ctx, x, 410, 480, 380, themeColors.panel, col, 3);
        drawExtendedText(ctx, api, name, x + 240, 465, 33, col, 'center');
        docs.forEach((v, j) => drawExtendedBox(ctx, api, v, x + 70, 530 + j * 120, 340, 75, col));
      });
      api.focus.target('group-sample', () => {
        const draw = [0, 2, 0],
          n = Math.min(3, Math.floor(cue('resample-documents').progress * 4));
        for (let i = 0; i < 3; i++) {
          const group = groups[draw[i]],
            x = 240 + i * 540,
            shown = i < n;
          api.rect(
            ctx,
            x,
            870,
            470,
            145,
            themeColors.panel,
            shown ? group[2] : themeColors.muted,
            2,
          );
          drawExtendedText(
            ctx,
            api,
            shown ? 'draw ' + (i + 1) + ': ' + group[0] : 'draw ' + (i + 1) + ' ?',
            x + 235,
            918,
            29,
            shown ? group[2] : themeColors.muted,
            'center',
          );
          if (shown)
            drawExtendedText(ctx, api, group[1].join(' + '), x + 235, 980, 28, group[2], 'center');
        }
      });
      drawExtendedText(
        ctx,
        api,
        'Count every document in a sampled source each time you draw it.',
        960,
        1040,
        29,
        themeColors.yellow,
        'center',
      );
    } else {
      drawExtendedTitle(ctx, api, 'Source record: job 612 is queued');
      const swap = cue('judge-order').phase === 'after';
      const answers = [
        ['A', '“The job is waiting.”', themeColors.blue],
        ['B', '“The job finished.”', themeColors.cyan],
      ];
      (swap ? [answers[1], answers[0]] : answers).forEach(([id, claim, color], i) => {
        const x = 235 + i * 815;
        drawExtendedText(ctx, api, 'Answer ' + id, x + 320, 420, 45, color, 'center');
        drawExtendedBox(ctx, api, claim, x, 470, 640, 120, color);
      });
      api.focus.target('judge-controls', () => {
        drawExtendedText(
          ctx,
          api,
          swap ? 'A still matches the record.' : 'Which answer matches the record?',
          960,
          790,
          49,
          swap ? themeColors.green : themeColors.ink,
          'center',
        );
      });
      if (swap)
        drawExtendedText(
          ctx,
          api,
          'Does the judge still pick A after the swap?',
          960,
          910,
          38,
          themeColors.ink,
          'center',
        );
    }
    return;
  }
}
export default {
  id: 'report',
  draw: drawReport,
  cues: ['report-loss', 'report-recover', 'runtime-values', 'resample-documents', 'judge-order'],
};
