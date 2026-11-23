import { HEADS } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawArchitectures(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const snap = {
    ...TRACKS['architectures'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  {
    api.focus.target('architectures-the-query-row-stays-fixed-while-the-stored-head-co', () =>
      text(
        ctx,
        api,
        'The query row stays fixed while the stored-head count changes.',
        960,
        325,
        30,
        themeColors.ink,
        'center',
      ),
    );
    const configs = [
      {
        id: 'MHA',
        kv: 8,
        x: 200,
        color: themeColors.blue,
      },
      {
        id: 'GQA',
        kv: 2,
        x: 730,
        color: themeColors.green,
      },
      {
        id: 'MQA',
        kv: 1,
        x: 1260,
        color: themeColors.pink,
      },
    ];
    configs.forEach((config) => {
      const active = config.id === snap.active;
      api.focus.target('architecture-' + config.id.toLowerCase(), () =>
        card(
          ctx,
          api,
          'architectures',
          `${config.id} · Hkv=${config.kv}`,
          config.x,
          400,
          440,
          76,
          config.color,
          active ? 1 : 0.58,
          28,
        ),
      );
      api.focus.target('architectures-8-query-heads', () =>
        card(
          ctx,
          api,
          'architectures',
          '8 query heads',
          config.x + 22,
          525,
          396,
          72,
          themeColors.cyan,
          active ? 1 : 0.54,
          25,
        ),
      );
      const cols = config.kv;
      teaching.grid({
        cellFocusTarget: () => 'architecture-' + config.id.toLowerCase(),
        x: config.x + 22,
        y: 650,
        width: cols * 49.5,
        height: 102,
        rows: 1,
        columns: cols,
        fill: themeColors.panel,
        stroke: themeColors.border,
        lineWidth: 2,
        labels: [
          Array.from(
            {
              length: cols,
            },
            () => '',
          ),
        ],
        highlights: Array.from(
          {
            length: cols,
          },
          (_, column) => ({
            row: 0,
            column,
            fill: config.color,
            opacity: active ? 1 : 0.44,
          }),
        ),
        fontSize: 24,
        textColor: themeColors.ink,
      });
      api.focus.target('architecture-' + config.id.toLowerCase(), () =>
        text(
          ctx,
          api,
          `${config.kv} stored KV histories`,
          config.x + 220,
          780,
          25,
          config.color,
          'center',
        ),
      );
      const factor = HEADS.queries / config.kv;
      const comparison =
        config.id === 'MHA'
          ? 'Baseline · 8 stored pairs'
          : `${factor}× fewer stored pairs than MHA`;
      api.focus.target('architecture-' + config.id.toLowerCase(), () =>
        card(
          ctx,
          api,
          'architectures',
          comparison,
          config.x + 12,
          805,
          416,
          74,
          config.color,
          active ? 1 : 0.48,
          24,
        ),
      );
    });
    api.focus.target('architectures-equation', () =>
      equation(
        ctx,
        api,
        String.raw`\text{group size}=H_q/H_{kv}`,
        960,
        925,
        32,
        themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'architectures',
  draw: drawArchitectures,
  cues: [
    'mha-count',
    'gqa-count',
    'mqa-count',
    'raw-saving',
    'eightfold-saving',
    'several-subspaces',
    'group-tradeoff',
  ],
};
