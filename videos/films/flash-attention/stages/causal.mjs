import { SCORES, VALUES } from '../fixtures.mjs';
import { absoluteCausalPairs, summarize } from '../model.mjs';
import { drawOriginalFlashCard, drawOriginalFlashText } from '../defaults.mjs';
export function drawCausal(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92);
  const total = summarize(SCORES, VALUES),
    a = summarize([1, 2], [10, 20]),
    beta = Math.exp(-1),
    out = total.u / total.l;
  {
    if (currentBeat < 2) {
      const reveal =
          currentBeat === 0
            ? Math.ceil(16 * api.focus.progress('causal-tiles', phaseForBeat(0)))
            : 16,
        counts = {
          past: 0,
          diagonal: 0,
          future: 0,
        };
      const values = Array.from(
        {
          length: 4,
        },
        (_, i) =>
          Array.from(
            {
              length: 4,
            },
            (_, j) => {
              if (i * 4 + j >= reveal) return '';
              const kind = j > i ? 'future' : j === i ? 'diagonal' : 'past';
              counts[kind]++;
              return kind === 'future' ? '×' : kind === 'diagonal' ? '△' : '●';
            },
          ),
      );
      api.focus.target('causal-readout', () =>
        drawOriginalFlashText(
          ctx,
          api,
          currentBeat === 0
            ? 'Equal aligned tiles: classify before computing'
            : 'Open a diagonal tile: compare its actual positions',
          960,
          280,
          37,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('causal-readout-2', () =>
        components.matrix({
          values,
          x: 300,
          y: 390,
          cellSize: 100,
          gap: 10,
          style: {
            fill: themeColors.panel,
            fontSize: 38,
            padding: 12,
          },
          cellStyle: (_, i, j) => ({
            textColor: j > i ? themeColors.muted : j === i ? themeColors.yellow : themeColors.cyan,
            stroke: j > i ? themeColors.muted : j === i ? themeColors.yellow : themeColors.cyan,
          }),
        }),
      );
      if (currentBeat === 0) {
        api.focus.target('causal-readout-3', () =>
          drawOriginalFlashCard(
            ctx,
            api,
            counts.past + ' past tile pairs',
            1030,
            405,
            650,
            themeColors.cyan,
          ),
        );
        api.focus.target('causal-readout-4', () =>
          drawOriginalFlashCard(
            ctx,
            api,
            counts.diagonal + ' diagonal tile pairs',
            1030,
            565,
            650,
            themeColors.yellow,
          ),
        );
        api.focus.target('causal-readout-5', () =>
          drawOriginalFlashCard(
            ctx,
            api,
            counts.future + ' future pairs skipped',
            1030,
            725,
            650,
            themeColors.muted,
          ),
        );
      } else {
        const pairs = absoluteCausalPairs([2, 3], [2, 3]),
          visible = Math.ceil(4 * api.focus.progress('diagonal-mask', phaseForBeat(1)));
        api.focus.target('causal-query-tile-1-key-tile-1', () =>
          drawOriginalFlashText(
            ctx,
            api,
            'Query tile 1 · key tile 1',
            1300,
            345,
            29,
            themeColors.yellow,
            'center',
          ),
        );
        ['K2', 'K3'].forEach((v, i) =>
          api.focus.target('causal-readout-6', () =>
            drawOriginalFlashText(ctx, api, v, 1180 + i * 130, 400, 27, themeColors.blue, 'center'),
          ),
        );
        ['Q2', 'Q3'].forEach((v, i) =>
          api.focus.target('causal-readout-7', () =>
            drawOriginalFlashText(ctx, api, v, 1060, 495 + i * 130, 27, themeColors.blue, 'center'),
          ),
        );
        api.focus.target('causal-readout-8', () =>
          components.matrix({
            values: pairs.map((row, i) =>
              row.map((kind, j) => (i * 2 + j < visible ? (kind === 'allowed' ? '✓' : '×') : '')),
            ),
            x: 1120,
            y: 435,
            cellSize: 120,
            gap: 10,
            style: {
              fill: themeColors.panel,
              fontSize: 38,
              padding: 12,
            },
            cellStyle: (_, i, j) => ({
              textColor: pairs[i][j] === 'allowed' ? themeColors.cyan : themeColors.muted,
              stroke: pairs[i][j] === 'allowed' ? themeColors.cyan : themeColors.muted,
            }),
          }),
        );
        api.focus.target('causal-6-past-4-diagonal-6-future-tile-pairs', () =>
          drawOriginalFlashText(
            ctx,
            api,
            '6 past · 4 diagonal · 6 future tile pairs',
            1300,
            800,
            28,
            themeColors.ink,
            'center',
          ),
        );
      }
      api.focus.target('causal-readout-9', () =>
        drawOriginalFlashText(
          ctx,
          api,
          currentBeat === 0
            ? 'Past tiles contribute fully; future tiles can be skipped'
            : 'Diagonal tiles still mask individual future key positions',
          960,
          945,
          31,
          themeColors.muted,
          'center',
        ),
      );
    } else {
      const queries = [4, 5],
        keys = [0, 1, 2, 3, 4, 5, 6, 7],
        pairs = absoluteCausalPairs(queries, keys, 6),
        visible = Math.ceil(16 * api.focus.progress('absolute-positions', phaseForBeat(2))),
        counts = {
          allowed: 0,
          future: 0,
          unused: 0,
        };
      api.focus.target('causal-two-new-queries-six-valid-cached-keys-two-unused-slots', () =>
        drawOriginalFlashText(
          ctx,
          api,
          'Two new queries · six valid cached keys · two unused slots',
          960,
          280,
          36,
          themeColors.ink,
          'center',
        ),
      );
      keys.forEach((key, j) =>
        api.focus.target('causal-readout-10', () =>
          drawOriginalFlashText(
            ctx,
            api,
            'K' + key,
            490 + j * 130,
            390,
            27,
            j < 6 ? themeColors.blue : themeColors.muted,
            'center',
          ),
        ),
      );
      queries.forEach((query, i) =>
        api.focus.target('causal-readout-11', () =>
          drawOriginalFlashText(
            ctx,
            api,
            'Q' + query,
            340,
            490 + i * 130,
            31,
            themeColors.yellow,
            'center',
          ),
        ),
      );
      const values = pairs.map((row, i) =>
        row.map((kind, j) => {
          if (i * 8 + j >= visible) return '';
          counts[kind]++;
          return kind === 'allowed' ? '✓' : kind === 'future' ? '×' : 'pad';
        }),
      );
      api.focus.target('causal-readout-12', () =>
        components.matrix({
          values,
          x: 430,
          y: 430,
          cellSize: 120,
          gap: 10,
          style: {
            fill: themeColors.panel,
            fontSize: 32,
            padding: 12,
          },
          cellStyle: (_, i, j) => ({
            textColor: pairs[i][j] === 'allowed' ? themeColors.cyan : themeColors.muted,
            stroke: pairs[i][j] === 'allowed' ? themeColors.cyan : themeColors.muted,
          }),
        }),
      );
      api.focus.target('causal-readout-13', () =>
        drawOriginalFlashText(
          ctx,
          api,
          `${counts.allowed} allowed · ${counts.future} future masked · ${counts.unused} unused masked`,
          960,
          805,
          34,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('causal-allow-a-valid-key-only-when-its-absolute-position-is-at-m', () =>
        drawOriginalFlashText(
          ctx,
          api,
          'Allow a valid key only when its absolute position is at most the query position',
          960,
          945,
          29,
          themeColors.muted,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'causal',
  draw: drawCausal,
  cues: [
    'causal-tiles',
    'skip-future',
    'diagonal-mask',
    'past-tiles',
    'absolute-positions',
    'cached-history',
    'valid-tail',
  ],
};
