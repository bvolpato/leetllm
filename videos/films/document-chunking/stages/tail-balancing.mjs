import { balancedChildren } from '../arithmetic.mjs';
import { LONG_SECTION } from '../fixtures.mjs';
import { extendedFrame } from '../construction.mjs';
import { overlapExperiment } from '../model.mjs';
import {
  extendedEquation,
  extendedNote,
  extendedText,
  spanBracket,
  wordRibbon,
} from '../defaults.mjs';
export function drawTailBalancing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('tail-balancing', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('tail-balancing-operation', () => {
    const stage = currentBeat > 0 || begun('tail-balance') ? 2 : begun('tail-merge') ? 1 : 0;
    const groups = stage === 0 ? [7, 7, 1] : stage === 1 ? [7, 8] : balancedChildren().map(row => row.length);
    const words = LONG_SECTION.split(/\s+/),
      coords =
        currentBeat < 2
          ? wordRibbon(ctx, api, words, 320, {
              colorFor: (i) => {
                const group = i < groups[0] ? 0 : i < groups[0] + groups[1] ? 1 : 2;
                return colors[group];
              },
            })
          : (i) => 155 + (i * 1610) / words.length;
    if (currentBeat === 0) {
      extendedText(
        ctx,
        api,
        'Same 15 source words · hard cap 7',
        960,
        265,
        32,
        themeColors.ink,
        'center',
      );
      let cursor = 0;
      groups.forEach((length, i) => {
        const start = cursor;
        cursor += length;
        spanBracket(
          ctx,
          api,
          coords(start),
          coords(cursor) - 6,
          535,
          length + ' words',
          length > 7 || length < 4 ? themeColors.pink : colors[i],
        );
      });
      if (stage === 2) {
        balancedChildren().forEach((row, i) => {
          const x = 410 + i * 550;
          extendedText(
            ctx,
            api,
            'chars [' + row.start + ', ' + row.end + ')',
            x,
            710,
            30,
            colors[i],
            'center',
          );
          extendedText(ctx, api, row.length + ' ≤ cap 7', x, 780, 32, colors[i], 'center');
        });
        if (begun('balance-not-evidence'))
          extendedText(
            ctx,
            api,
            'Length repaired. First child still lacks deploy ID.',
            960,
            925,
            35,
            themeColors.yellow,
            'center',
          );
      } else
        extendedText(
          ctx,
          api,
          stage === 0 ? 'Tail 1 < preferred minimum 4' : 'Merge makes 8 > hard cap 7',
          960,
          790,
          40,
          themeColors.pink,
          'center',
        );
      extendedNote(
        ctx,
        api,
        'Boundaries move; source order and exact half-open character spans remain attached.',
      );
    } else if (currentBeat === 1) {
      const rows = balancedChildren(LONG_SECTION, 7, 6);
      extendedText(
        ctx,
        api,
        'Change only the preferred minimum: 4 → 6',
        960,
        265,
        32,
        themeColors.yellow,
        'center',
      );
      rows.forEach((row, i) => {
        spanBracket(
          ctx,
          api,
          coords(i * 5),
          coords((i + 1) * 5) - 6,
          525,
          row.length + ' < preferred 6',
          themeColors.pink,
        );
      });
      const show = begun('tail-impossible');
      if (show) {
        extendedEquation(
          ctx,
          api,
          String.raw`\lceil15/7\rceil=3\qquad3\cdot6=18>15`,
          960,
          740,
          47,
          themeColors.pink,
        );
        extendedText(
          ctx,
          api,
          'Hard cap holds · undersized children need review',
          960,
          908,
          36,
          themeColors.yellow,
          'center',
        );
      }
      extendedNote(ctx, api, 'A length repair does not establish complete answer evidence.');
    } else {
      extendedText(
        ctx,
        api,
        'Window stride = size − overlap',
        960,
        265,
        36,
        themeColors.cyan,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Original 17-word runbook fixture',
        960,
        330,
        29,
        themeColors.muted,
        'center',
      );
      const rows = overlapExperiment();
      rows.forEach((row, i) => {
        const y = 490 + i * 135;
        extendedText(ctx, api, 'overlap ' + row.overlap, 180, y + 30, 29, colors[i]);
        api.rect(ctx, 555, y, (840 * row.indexedWords) / 33, 45, colors[i], undefined, 3);
        extendedText(
          ctx,
          api,
          row.indexedWords + ' indexed words',
          1455,
          y + 32,
          28,
          colors[i],
          'left',
        );
      });
      if (begun('overlap-asymptotic'))
        extendedEquation(
          ctx,
          api,
          String.raw`r=0.20\quad\Rightarrow\quad\frac1{1-r}=1.25`,
          960,
          390,
          40,
          themeColors.ink,
        );
      extendedText(
        ctx,
        api,
        'Every window ≤ 7 · complete rule = 10 · complete individual rules = 0',
        960,
        932,
        31,
        themeColors.pink,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Long-document approximation and exact short-document counts answer different questions.',
      );
    }
  });
}
export default {
  id: 'tail-balancing',
  draw: drawTailBalancing,
  cues: [
    'tail-balancing-0',
    'tail-merge',
    'tail-balance',
    'balance-not-evidence',
    'tail-balancing-1',
    'tail-impossible',
    'tail-balancing-2',
    'overlap-asymptotic',
  ],
};
