import { catalog } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawEligibility(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('eligibility', state);
  {
    text(
      ctx,
      api,
      'Raw retrieval results · label-printer query',
      500,
      285,
      35,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      'Only permitted candidates enter ranking',
      1430,
      285,
      35,
      themeColors.green,
      'center',
    );
    const sources = catalog.map((row, i) => {
      const x = 170,
        y = 320 + i * 136;
      const shape = api.focus.target(row.ok ? 'candidate-rows' : 'rejected-rows', () =>
        card(
          ctx,
          api,
          `${row.id} · match ${row.match.toFixed(2)}`,
          x,
          y,
          470,
          row.ok ? themeColors.cyan : themeColors.pink,
          82,
        ),
      );
      api.focus.target('rejection-reasons', () =>
        text(
          ctx,
          api,
          row.ok ? 'eligible' : row.id === 'P8' ? 'policy block' : 'wrong region',
          x + 235,
          y + 112,
          23,
          row.ok ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
      return {
        row,
        shape,
      };
    });
    const activeRows = catalog.filter((row) => row.ok).slice(0, modelState.shortlistCount);
    const poolLabel = activeRows.length
      ? `Ranking pool · ${activeRows.length}/3\n${activeRows.map((row) => `${row.id} · ${row.match.toFixed(2)}`).join('\n')}`
      : 'Ranking pool · 0/3\nNo candidate admitted yet';
    const pool = api.focus.target('ranking-pool', () =>
      card(ctx, api, poolLabel, 1120, 410, 640, themeColors.green, 330),
    );
    const arrivals = [
      [0.1, 0.32],
      [0.38, 0.6],
      [0.72, 0.94],
    ];
    sources.forEach(({ row, shape }, i) => {
      if (!row.ok) return;
      const allowedIndex = catalog
        .filter((candidate) => candidate.ok)
        .findIndex((candidate) => candidate.id === row.id);
      const [start, end] = arrivals[allowedIndex];
      teaching.transfer({
        source: {
          shape,
          opacity: 1,
        },
        target: {
          shape: pool,
          opacity: 1,
        },
        color: themeColors.green,
        progress: api.clamp((modelState.q - start) / (end - start), 0, 1),
        particle: {
          radius: 8,
          fill: themeColors.yellow,
        },
      });
    });
  }
}
export default {
  id: 'eligibility',
  draw: drawEligibility,
  cues: [
    'eligibility-b1-1',
    'eligibility-b1-2',
    'eligibility-b1-3',
    'eligibility-b2-1',
    'eligibility-b2-2',
  ],
};
