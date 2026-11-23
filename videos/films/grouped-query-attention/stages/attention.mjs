import { KV_KEYS, KV_VALUES, QUERY_VECTORS } from '../fixtures.mjs';
import { ATTENTION, TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawAttention(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const snap = {
    ...TRACKS['attention'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  const GROUP_COLORS = [themeColors.cyan, themeColors.pink];
  {
    api.focus.target('attention-cached-keys', () =>
      card(ctx, api, 'attention', 'Cached keys', 250, 390, 320, 74, themeColors.blue, 1, 26),
    );
    api.focus.target('attention-cached-values', () =>
      card(ctx, api, 'attention', 'Cached values', 250, 660, 320, 74, themeColors.green, 1, 26),
    );
    KV_KEYS[0].forEach((key, index) => {
      api.focus.target('attention-readout', () =>
        card(
          ctx,
          api,
          'attention',
          `K${index + 1} · [${key.join(', ')}]`,
          620,
          390 + index * 88,
          420,
          70,
          themeColors.blue,
          1,
          25,
        ),
      );
      api.focus.target('attention-readout-2', () =>
        card(
          ctx,
          api,
          'attention',
          `V${index + 1} · [${KV_VALUES[0][index].join(', ')}]`,
          620,
          660 + index * 88,
          420,
          70,
          themeColors.green,
          1,
          25,
        ),
      );
    });
    snap.heads.forEach((head, row) => {
      const result = ATTENTION[head],
        y = 350 + row * 300,
        calculated = state.cues
          ? beat > 0
            ? 1
            : api.focus.progress('blend-values', 0) > 0
              ? 0.8
              : api.focus.progress('softmax-weights', 0) > 0
                ? 0.5
                : api.focus.progress('dot-scores', 0) > 0
                  ? 0.3
                  : 0
          : beat > row
            ? 1
            : beat < row
              ? 0
              : phaseForBeat(0.08, 0.82);
      api.focus.target('attention-readout-3', () =>
        card(
          ctx,
          api,
          'attention',
          `Query head ${head} · [${QUERY_VECTORS[head].join(', ')}]`,
          1120,
          y,
          540,
          62,
          GROUP_COLORS[result.group],
          1,
          24,
        ),
      );
      const grid = (values, offset, color) =>
        teaching.grid({
          cellFocusTarget: () => (offset === 72 ? 'attention-scores' : 'attention-weights'),
          x: 1330,
          y: y + offset,
          width: 300,
          height: 54,
          rows: 1,
          columns: 2,
          fill: themeColors.panel,
          stroke: themeColors.border,
          labels: [values],
          fontSize: 25,
          textColor: color,
        });
      api.focus.target('attention-scores', () =>
        text(ctx, api, 'scaled scores', 1120, y + 105, 24, themeColors.muted),
      );
      grid(
        result.scores.map((v) => (calculated > 0.25 ? v.toFixed(3) : '·')),
        72,
        themeColors.blue,
      );
      api.focus.target('attention-weights', () =>
        text(ctx, api, 'softmax', 1120, y + 165, 24, themeColors.muted),
      );
      grid(
        result.weights.map((v) => (calculated > 0.48 ? v.toFixed(3) : '·')),
        132,
        themeColors.cyan,
      );
      if (calculated > 0.68) {
        const u = state.cues ? api.focus.progress('blend-values', 0) : phaseForBeat(0.25, 0.9);
        result.weights.forEach((weight, i) => {
          const from = {
              x: 1046,
              y: 695 + i * 88,
            },
            to = {
              x: 1110,
              y: y + 228,
            },
            mid = {
              x: 1076,
              y: from.y,
            };
          api.path(
            ctx,
            [
              from,
              mid,
              {
                x: 1076,
                y: to.y,
              },
              to,
            ],
            {
              color: themeColors.muted,
              width: 1,
            },
          );
          const phase = u * 3,
            point =
              phase < 1
                ? {
                    x: api.lerp(from.x, mid.x, phase),
                    y: from.y,
                  }
                : phase < 2
                  ? {
                      x: mid.x,
                      y: api.lerp(from.y, to.y, phase - 1),
                    }
                  : {
                      x: api.lerp(mid.x, to.x, phase - 2),
                      y: to.y,
                    };
          api.circle(
            ctx,
            point.x,
            point.y,
            3 + weight * 4,
            themeColors.green,
            themeColors.green,
            1,
          );
        });
        api.focus.target('attention-readout-4', () =>
          card(
            ctx,
            api,
            'attention',
            `Output · [${result.output.map((value) => value.toFixed(3)).join(', ')}]`,
            1120,
            y + 198,
            540,
            62,
            themeColors.yellow,
            1,
            24,
          ),
        );
      }
    });
    api.focus.reveal('softmax-weights', () =>
      api.focus.target('attention-equation', () =>
        equation(
          ctx,
          api,
          String.raw`\text{softmax}(qK^\top/\sqrt{d})V`,
          930,
          940,
          34,
          themeColors.yellow,
        ),
      ),
    );
  }
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'query-keys',
    'dot-scores',
    'softmax-weights',
    'blend-values',
    'different-queries',
    'different-combinations',
    'separate-results',
    'stored-histories',
  ],
};
