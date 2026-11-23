import { chapterModel } from '../construction.mjs';
import { cacheBytes } from '../model.mjs';
import { chapterText, grid, note, operation } from '../defaults.mjs';
export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('earned-transfer', state),
    currentBeat = m.beat,
    progress2 = m.p;
  {
    const complete = (id, at = 0.85) =>
      state.cues ? state.cues[id]?.phase === 'after' : progress2 >= at;
    const owner = currentBeat === 1 && complete('earned-owner');
    if (currentBeat < 2) {
      chapterText(
        ctx,
        api,
        '48 queries · 6 stored histories · 12 ranks',
        960,
        275,
        38,
        themeColors.cyan,
      );
      grid(
        ctx,
        api,
        280,
        370,
        6,
        8,
        68,
        (r, c) => (owner && r * 8 + c === 19 ? themeColors.yellow : themeColors.panel),
        (r, c) => (r * 8 + c === 19 ? '19' : ''),
      );
      for (let group = 0; group < 6; group++)
        chapterText(
          ctx,
          api,
          'KV' + group,
          1000,
          414 + group * 68,
          30,
          owner && group === 2 ? themeColors.yellow : themeColors.muted,
        );
      operation(ctx, api, 'earned-transfer', () =>
        chapterText(
          ctx,
          api,
          owner ? '19 ÷ 8 → KV group 2' : 'Which KV group owns query 19?',
          1350,
          875,
          38,
          themeColors.yellow,
        ),
      );
      note(ctx, api, 'Each query retains its own scores, weights and output');
    } else {
      const settled = currentBeat > 2,
        headReady = settled || complete('earned-head-bytes'),
        logicalReady = settled || complete('earned-logical-bytes'),
        physicalReady = settled || complete('earned-bytes'),
        mhaReady = settled || complete('earned-mha-bytes'),
        savingReady = settled || complete('earned-saving');
      const headBytes = cacheBytes({
          layers: 32,
          batch: 1,
          tokens: 1024,
          kvHeads: 1,
          width: 64,
          bytes: 2,
        }),
        headMiB = headBytes / 2 ** 20;
      chapterText(
        ctx,
        api,
        headReady
          ? `Each rank has four queries and one ${headMiB} MiB KV head`
          : 'Each rank has four queries and one physical KV head',
        960,
        275,
        36,
        themeColors.cyan,
      );
      const progress = state.cues
          ? (state.cues['earned-rank-copies']?.progress ?? 0)
          : progress2 / 0.35,
        n = settled ? 12 : Math.ceil(12 * Math.max(0, Math.min(1, progress)));
      for (let rank = 0; rank < 12; rank++) {
        const x = 280 + (rank % 4) * 360,
          y = 370 + Math.floor(rank / 4) * 145,
          head = Math.floor(rank / 2);
        api.rect(
          ctx,
          x,
          y,
          300,
          110,
          themeColors.panel,
          rank < n ? (head % 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
          3,
        );
        chapterText(
          ctx,
          api,
          'rank ' + rank + ' · KV' + head,
          x + 150,
          y + 42,
          28,
          themeColors.ink,
        );
        if (rank < n)
          chapterText(
            ctx,
            api,
            headReady ? `${headMiB} MiB` : 'four queries · one KV',
            x + 150,
            y + 85,
            headReady ? 31 : 24,
            headReady ? themeColors.yellow : themeColors.muted,
          );
      }
      const totals = [
        logicalReady ? `6 logical: ${6 * headMiB} MiB` : null,
        physicalReady ? `12 physical: ${12 * headMiB} MiB` : null,
        mhaReady ? `MHA: ${48 * headMiB} MiB` : null,
      ].filter(Boolean);
      operation(ctx, api, 'earned-transfer', () =>
        chapterText(
          ctx,
          api,
          totals.length ? totals.join(' · ') : 'Count physical copies before predicting the saving',
          960,
          895,
          37,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        savingReady
          ? '32 layers · 1,024 positions · width 64 · two-byte K/V · fourfold saving'
          : '32 layers · 1,024 positions · width 64 · two-byte K and V',
      );
    }
  }
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'earned-transfer-0',
    'earned-owner',
    'earned-transfer-1',
    'earned-bytes',
    'earned-rank-copies',
    'earned-head-bytes',
    'earned-logical-bytes',
    'earned-mha-bytes',
    'earned-saving',
    'earned-transfer-2',
  ],
};
