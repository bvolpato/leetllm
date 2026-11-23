import { POSTINGS, SOUP_POSITIONS, TERMS, TOKENS } from '../analysis.mjs';
import { TRACKS } from '../model.mjs';
import { drawOriginalCard, drawOriginalText, drawVisualFocus } from '../defaults.mjs';
export function drawPostings(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const revealProgress = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const snapshot = TRACKS['postings'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    drawOriginalText(
      ctx,
      api,
      beat > 0 ? 'Inverted index · term → document IDs' : snapshot.label,
      960,
      286,
      36,
      themeColors.ink,
      'center',
    );
    if (snapshot.postings || beat > 0) {
      drawVisualFocus(ctx, api, 'postings-simulation-7', () =>
        Object.entries(snapshot.postings ?? POSTINGS).forEach(([term, ids], index) => {
          const x = 250 + index * 730;
          drawOriginalCard(
            ctx,
            api,
            'postings',
            `${term} → ${ids.join(', ') || 'empty list'}`,
            x,
            490,
            620,
            110,
            themeColors.cyan,
            1,
            32,
          );
          drawOriginalText(
            ctx,
            api,
            `${ids.length} document ${ids.length === 1 ? 'ID' : 'IDs'}`,
            x + 310,
            675,
            28,
            themeColors.yellow,
            'center',
          );
        }),
      );
      if (beat > 1)
        drawVisualFocus(ctx, api, 'postings-d4-occurrences', () => {
          drawOriginalText(
            ctx,
            api,
            'd4 · analyzed tokens',
            960,
            725,
            28,
            themeColors.muted,
            'center',
          );
          TOKENS.d4.forEach((token, i) => {
            const x = 190 + i * 151;
            drawOriginalText(ctx, api, i + 1, x + 65, 775, 24, themeColors.muted, 'center');
            drawOriginalCard(
              ctx,
              api,
              'postings',
              token,
              x,
              790,
              130,
              70,
              token === 'soup' ? themeColors.yellow : themeColors.muted,
              1,
              25,
            );
          });
          drawOriginalCard(
            ctx,
            api,
            'postings',
            'soup → d4 · count 2 · positions ' + SOUP_POSITIONS.join(', '),
            520,
            920,
            880,
            75,
            themeColors.yellow,
            1,
            30,
          );
        });
    } else {
      const table = drawVisualFocus(ctx, api, 'postings-document-terms', () =>
        teaching.grid({
          x: 455,
          y: 390,
          width: 1110,
          height: 400,
          rows: 4,
          columns: TERMS.length,
          labels: snapshot.counts.map((row) => row.map(String)),
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          lineWidth: 2,
          highlights: snapshot.counts[snapshot.focus].map((value, column) => ({
            row: snapshot.focus,
            column,
            fill: value === 0 ? themeColors.pink : themeColors.blue,
            stroke: themeColors.cyan,
            opacity: revealProgress(0.08, 0.85),
          })),
          fontSize: 32,
          textColor: themeColors.ink,
        }),
      );
      ['d1 · soup recipe', 'd2 · cooked beans', 'd3 · garden sign', 'd4 · soup menu'].forEach(
        (label, row) =>
          drawOriginalText(
            ctx,
            api,
            label,
            405,
            440 + row * 100,
            27,
            row === snapshot.focus ? themeColors.yellow : themeColors.ink,
            'right',
          ),
      );
      TERMS.forEach((term, column) =>
        drawOriginalText(
          ctx,
          api,
          term,
          455 + (1110 * (column + 0.5)) / TERMS.length,
          365,
          29,
          themeColors.cyan,
          'center',
        ),
      );
      drawOriginalText(
        ctx,
        api,
        'Term occurrences in each passage',
        960,
        855,
        29,
        themeColors.muted,
        'center',
      );
      if (table?.bounds)
        drawOriginalText(
          ctx,
          api,
          'one row keeps one document identity',
          960,
          925,
          28,
          themeColors.yellow,
          'center',
        );
    }
  }
}
export default {
  id: 'postings',
  draw: drawPostings,
  cues: [
    'postings-documents',
    'postings-recipe-counts',
    'postings-ids',
    'postings-beat-3-focus-1',
    'postings-position-metadata',
  ],
};
