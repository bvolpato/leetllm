import { HEADS } from '../fixtures.mjs';
import { SNAPSHOTS, TRACKS } from '../construction.mjs';
import { cacheBytes } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const snap = {
    ...TRACKS['opening'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  {
    const previous = beat === 0 ? 0 : SNAPSHOTS.opening[beat - 1].tokens;
    const count = previous + (phaseForBeat(0.05, 0.82) > 0.35 ? 1 : 0);
    api.focus.target('opening-readout', () =>
      text(ctx, api, snap.title, 960, 330, 33, themeColors.ink, 'center'),
    );
    const archs = [
      {
        id: 'MHA',
        kv: HEADS.mhaKV,
        y: 420,
        color: themeColors.blue,
      },
      {
        id: 'GQA',
        kv: HEADS.gqaKV,
        y: 575,
        color: themeColors.green,
      },
      {
        id: 'MQA',
        kv: HEADS.mqaKV,
        y: 730,
        color: themeColors.pink,
      },
    ];
    archs.forEach((arch, archIndex) => {
      const bytes = cacheBytes({
        tokens: count,
        kvHeads: arch.kv,
      });
      const maxBytes = cacheBytes({
        tokens: HEADS.tokens,
        kvHeads: HEADS.mhaKV,
      });
      const width = 890 * (bytes / maxBytes);
      api.focus.target('history-volume', () =>
        text(ctx, api, `${arch.id} · ${arch.kv} stored KV heads`, 260, arch.y + 31, 25, arch.color),
      );
      if (count)
        api.focus.target('history-volume', () =>
          api.rect(ctx, 735, arch.y, Math.max(10, width), 64, arch.color, undefined, 8),
        );
      for (let token = 1; token < count; token += 1) {
        const x = 735 + (width * token) / count;
        api.path(
          ctx,
          [
            {
              x,
              y: arch.y + 7,
            },
            {
              x,
              y: arch.y + 57,
            },
          ],
          {
            color: themeColors.bg,
            width: 3,
            opacity: phaseForBeat(token * 0.05, 0.75),
          },
        );
      }
      api.focus.target('history-volume', () =>
        text(
          ctx,
          api,
          `${count} token${count === 1 ? '' : 's'}`,
          1780,
          arch.y + 31,
          24,
          themeColors.ink,
          'right',
        ),
      );
    });
    api.focus.target('opening-the-same-token-history-with-different-numbers-of-key-and', () =>
      text(
        ctx,
        api,
        'The same token history, with different numbers of key and value rows.',
        960,
        875,
        27,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'stored-history',
    'history-budget',
    'separate-queries',
    'shared-history',
    'map-groups',
    'cache-growth',
  ],
};
