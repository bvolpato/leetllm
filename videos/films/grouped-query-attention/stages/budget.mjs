import { TRACKS } from '../construction.mjs';
import { cacheBytes } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const snap = {
    ...TRACKS['budget'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  {
    snap.tokens =
      3 +
      (beat === 2 ||
      (beat === 1 &&
        (state.cues ? api.focus.progress('budget-fourth-position', 0) > 0.7 : progress > 0.8))
        ? 1
        : 0);
    snap.mha = cacheBytes({
      tokens: snap.tokens,
      kvHeads: 8,
    });
    snap.gqa = cacheBytes({
      tokens: snap.tokens,
      kvHeads: 2,
    });
    snap.mqa = cacheBytes({
      tokens: snap.tokens,
      kvHeads: 1,
    });
  }
  {
    const max = cacheBytes({
        tokens: 4,
        kvHeads: 8,
      }),
      configs = [
        {
          id: 'MHA',
          key: 'mha',
          bytes: snap.mha,
          y: 430,
          color: themeColors.blue,
        },
        {
          id: 'GQA',
          key: 'gqa',
          bytes: snap.gqa,
          y: 585,
          color: themeColors.green,
        },
        {
          id: 'MQA',
          key: 'mqa',
          bytes: snap.mqa,
          y: 740,
          color: themeColors.pink,
        },
      ];
    api.focus.target('budget-readout', () =>
      text(
        ctx,
        api,
        `Cached positions · ${snap.tokens}`,
        960,
        330,
        33,
        themeColors.yellow,
        'center',
      ),
    );
    configs.forEach((config) => {
      const active = config.id === snap.active;
      const kvHeads = config.id === 'MHA' ? 8 : config.id === 'GQA' ? 2 : 1;
      api.focus.target('budget-readout-2', () =>
        text(
          ctx,
          api,
          `${config.id} · ${kvHeads} KV ${kvHeads === 1 ? 'head' : 'heads'}`,
          280,
          config.y + 34,
          27,
          config.color,
        ),
      );
      const barWidth = (840 * config.bytes) / max;
      api.focus.target('cache-bytes-' + config.id.toLowerCase(), () =>
        card(
          ctx,
          api,
          'budget',
          '',
          650,
          config.y,
          Math.max(16, barWidth),
          78,
          config.color,
          active ? 1 : 0.55,
          24,
        ),
      );
      if (barWidth > 0)
        api.focus.target('cache-bytes-' + config.id.toLowerCase(), () =>
          api.rect(ctx, 650, config.y + 18, barWidth, 42, config.color, undefined, 3),
        );
      for (let token = 1; token < snap.tokens; token += 1) {
        const x = 650 + (barWidth * token) / snap.tokens;
        api.path(
          ctx,
          [
            {
              x,
              y: config.y + 18,
            },
            {
              x,
              y: config.y + 60,
            },
          ],
          {
            color: themeColors.bg,
            width: 3,
          },
        );
      }
      api.focus.target('cache-bytes-' + config.id.toLowerCase(), () =>
        text(ctx, api, `${config.bytes} bytes`, 1750, config.y + 34, 27, config.color, 'right'),
      );
    });
    api.focus.target('budget-two-layers-one-request-width-4-two-bytes-per-value', () =>
      text(
        ctx,
        api,
        'Two layers · one request · width 4 · two bytes per value',
        960,
        950,
        25,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'fixture-dimensions',
    'mha-bytes',
    'gqa-bytes',
    'mqa-bytes',
    'budget-fourth-position',
    'logical-payload',
    'device-count',
  ],
};
