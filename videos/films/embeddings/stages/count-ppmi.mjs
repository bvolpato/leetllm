import { EMBEDDING_COUNTS } from '../fixtures.mjs';
import { completed, event } from '../construction.mjs';
import { countRepresentation } from '../model.mjs';
import { card, centeredText, extensionText, footer, numberMatrix } from '../defaults.mjs';
export function drawCountPpmi(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('count-ppmi-mechanism', () => {
    const m = countRepresentation(),
      build = ev('count-build', 0),
      show = done('count-log', 1),
      marg = ev('count-marginals', 1) > 0;
    numberMatrix(ctx, api, themeColors, fmt, EMBEDDING_COUNTS, 280, 395, {
      cell: 95,
      label: 'Supplied count fixture',
      rowNames: ['apple', 'pear', 'river', 'lake'],
      columns: ['fruit', 'sweet', 'water', 'shore'],
      visible: (r, c) => r * 4 + c < Math.ceil(build * 16),
      format: (v) => String(v),
    });
    if (marg) {
      extensionText(ctx, api, 'row 14', 740, 455, 31, themeColors.yellow);
      centeredText(ctx, api, 'column 15', 330, 900, 30, themeColors.yellow);
      centeredText(ctx, api, 'total 53', 690, 900, 30, themeColors.yellow);
    }
    centeredText(ctx, api, 'apple · fruit', 1340, 330, 36, themeColors.cyan);
    centeredText(ctx, api, 'observed count = 8', 1340, 425, 35, themeColors.ink);
    centeredText(ctx, api, 'independence: (14 × 15) / 53', 1340, 535, 32, themeColors.yellow);
    centeredText(
      ctx,
      api,
      done('count-expected', 1) ? 'expected ' + fmt(m.expected[0][0]) : 'expected ?',
      1340,
      625,
      38,
      themeColors.yellow,
    );
    centeredText(
      ctx,
      api,
      show ? 'ln(8 / ' + fmt(m.expected[0][0]) + ') = ' + fmt(m.ppmi[0][0]) : 'log ratio ?',
      1340,
      740,
      37,
      themeColors.green,
    );
    if (currentBeat === 2) {
      centeredText(ctx, api, 'PPMI = max(log ratio, 0)', 1340, 850, 34, themeColors.green);
      if (ev('count-zeros', 2) > 0) {
        const n = Math.floor(4 * ev('count-zeros', 2));
        for (let i = 0; i < n; i++) {
          const x = 1060 + i * 145;
          card(ctx, api, '0', x, 900, 115, themeColors.muted, 65);
        }
      }
    }
    footer(
      ctx,
      api,
      'Observed cells only enter log; unobserved cells are assigned 0 before any logarithm',
    );
  });
}
export default {
  id: 'count-ppmi',
  draw: drawCountPpmi,
  cues: [
    'emb-count-build',
    'emb-count-marginals',
    'emb-count-expected',
    'emb-count-log',
    'emb-count-floor',
    'emb-count-zeros',
  ],
};
