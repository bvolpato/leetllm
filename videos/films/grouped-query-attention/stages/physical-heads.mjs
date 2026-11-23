import { chapterModel } from '../construction.mjs';
import { physicalHeads } from '../model.mjs';
import { chapterEquation, chapterText, grid, note, operation } from '../defaults.mjs';
export function drawPhysicalHeads(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('physical-heads', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    chapterText(
      ctx,
      api,
      currentBeat === 2
        ? 'Query divisibility can pass while KV divisibility fails'
        : 'Eight logical identities remain eight identities',
      960,
      270,
      37,
      themeColors.cyan,
    );
    if (currentBeat < 2) {
      const ranks = currentBeat === 0 ? 4 : 16,
        cols = 4,
        rows = ranks / cols,
        plan = physicalHeads(64, 8, ranks);
      for (let rank = 0; rank < ranks; rank++) {
        const x = 230 + (rank % cols) * 390,
          y = 370 + Math.floor(rank / cols) * 125;
        api.rect(ctx, x, y, 340, 98, themeColors.panel, themeColors.muted, 2);
        chapterText(
          ctx,
          api,
          'rank ' + rank + ' · Q ' + plan.queriesPerRank,
          x + 170,
          y + 35,
          26,
          themeColors.ink,
        );
        const ids = currentBeat === 0 ? [2 * rank, 2 * rank + 1] : [Math.floor(rank / 2)];
        ids.forEach((head, j) => {
          api.rect(
            ctx,
            x + 60 + j * 130,
            y + 50,
            110,
            37,
            head % 2 ? themeColors.pink : themeColors.green,
            themeColors.muted,
            1,
          );
          chapterText(ctx, api, 'KV' + head, x + 115 + j * 130, y + 78, 25, themeColors.ink);
        });
      }
      operation(ctx, api, 'physical-heads', () =>
        chapterText(
          ctx,
          api,
          `TP ${ranks}: ${plan.copies} physical KV copies · ${64 / plan.copies}× below MHA`,
          960,
          currentBeat === 0 ? 830 : 940,
          37,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Illustrated vLLM Llama layout · copies count aggregate payload, not a universal TP rule',
      );
    } else {
      grid(
        ctx,
        api,
        280,
        390,
        1,
        6,
        115,
        (r, c) => (c < Math.floor(6 * progress) ? themeColors.green : themeColors.panel),
        (r, c) => 'KV' + c,
      );
      [0, 1, 2, 3].forEach((rank) => {
        chapterText(ctx, api, 'rank ' + rank, 450 + rank * 350, 660, 32, themeColors.blue);
        chapterText(ctx, api, '6 queries', 450 + rank * 350, 730, 29, themeColors.blue);
      });
      operation(ctx, api, 'physical-heads', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`24/4=6\quad\text{but}\quad6\bmod4\ne0`,
          960,
          850,
          48,
          themeColors.red,
        ),
      );
      note(ctx, api, 'Reject this head partition; do not silently split a logical KV identity');
    }
  }
}
export default {
  id: 'physical-heads',
  draw: drawPhysicalHeads,
  cues: ['physical-heads-0', 'physical-heads-1', 'physical-heads-2'],
};
