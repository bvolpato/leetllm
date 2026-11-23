import { cosine } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { axes, centeredText } from '../defaults.mjs';
export function drawArticleContext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('article-context-mechanism', () => {
    const clauses = [
      {
        name: 'invoice sentence',
        clue: [0.2, 1],
        cue: 'charge-invoice',
        color: themeColors.cyan,
      },
      {
        name: 'phone instruction',
        clue: [1, 0.1],
        cue: 'charge-phone',
        color: themeColors.green,
      },
    ];
    clauses.forEach((row, i) => {
      const x = 130 + i * 920;
      centeredText(ctx, api, row.name, x + 330, 285, 34, row.color);
      const a = axes(ctx, api, x, 365, 650, 340, [0, 1.2], [0, 1.2], [0, 0.5, 1]),
        terms = [
          {
            id: 'charge-' + i,
            label: 'stored',
            weight: 0.5,
            values: [0.8, 0.2],
            color: themeColors.blue,
          },
          {
            id: 'clue-' + i,
            label: 'clue',
            weight: 0.5,
            values: row.clue,
            color: row.color,
          },
        ];
      const progress = ev(row.cue, 0);
      api.teaching.vectorAccumulation({
        plot: a,
        terms,
        progress,
        ledger: {
          x: x + 10,
          y: 745,
          width: 720,
          height: 240,
        },
        fontSize: 26,
        color: row.color,
        restColor: themeColors.muted,
        revealTotal: progress === 1,
        totalLabel: 'Occurrence',
        format: fmt,
      });
      if (currentBeat > 0) {
        const state = [0.5 * (0.8 + row.clue[0]), 0.5 * (0.2 + row.clue[1])];
        centeredText(
          ctx,
          api,
          'cos to invoice ' + fmt(cosine(state, [0.2, 1])),
          x + 340,
          1015,
          31,
          row.color,
        );
      }
    });
    if (currentBeat === 2)
      centeredText(
        ctx,
        api,
        'Hand-assigned mixture · real heads add learned V, masking, residual and output maps',
        960,
        330,
        26,
        themeColors.muted,
      );
  });
}
export default {
  id: 'article-context',
  draw: drawArticleContext,
  cues: ['emb-charge-invoice', 'emb-charge-phone', 'emb-charge-cosines', 'emb-charge-values'],
};
