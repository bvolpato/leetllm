import { cueVisible, footer, line, rankingText } from '../defaults.mjs';
export function drawTemporalProtocol(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('temporal-protocol-mechanism', () => {
    rankingText(ctx, api, '8 request groups · 3 products each · 24 rows', 150, 270, 34);
    const x = (day) => 350 + day * 130,
      groups = [
        ['TRAIN-1', 1.5, 2.375],
        ['TRAIN-2', 2.5, 3.375],
        ['TRAIN-3', 3.5, 4.375],
        ['PENDING-4', 4.5, 5.5],
        ['VALID-5', 5.5, 6.375],
        ['VALID-6', 6.5, 6.75],
        ['TEST-7', 7.5, 8.375],
        ['TEST-8', 8.5, 9.375],
      ];
    [1, 3, 5, 7, 10].forEach((day) =>
      rankingText(ctx, api, 'May' + day, x(day), 345, 25, themeColors.muted, 'center'),
    );
    groups.forEach(([id, served, label], i) => {
      const y = 415 + i * 60,
        color =
          id === 'PENDING-4'
            ? themeColors.pink
            : i < 3
              ? themeColors.blue
              : i < 6
                ? themeColors.cyan
                : themeColors.green;
      rankingText(ctx, api, id, 150, y + 8, 24, color);
      line(ctx, api, x(0), y, x(10), y, themeColors.muted, 1);
      for (let j = 0; j < 3; j++) api.rect(ctx, x(served) - 12 + j * 9, y - 12, 7, 25, color);
      if (currentBeat > 0 || cueVisible(ctx, api, 'temporal-clocks')) {
        line(ctx, api, x(served), y, x(label), y, color, 4);
        api.circle(ctx, x(label), y, 7, color);
      }
    });
    if (currentBeat === 0 && cueVisible(ctx, api, 'temporal-clocks'))
      footer(
        ctx,
        api,
        'Each request: feature available≤served≤label available; all three product rows stay together.',
      );
    if (currentBeat === 1) {
      if (cueVisible(ctx, api, 'temporal-windows'))
        for (const [day, color] of [
          [5, themeColors.blue],
          [7, themeColors.cyan],
          [10, themeColors.green],
        ])
          line(ctx, api, x(day), 370, x(day), 885, color, 3);
      if (cueVisible(ctx, api, 'temporal-freeze'))
        footer(
          ctx,
          api,
          'Label time equal to a strict freeze is excluded. Serving window and label freeze are separate.',
        );
    }
    if (currentBeat === 2 && cueVisible(ctx, api, 'temporal-counts')) {
      rankingText(
        ctx,
        api,
        'Train3 · validation2 · test2',
        960,
        945,
        38,
        themeColors.cyan,
        'center',
      );
      if (cueVisible(ctx, api, 'temporal-pending'))
        footer(
          ctx,
          api,
          'PENDING-4 arrives after May5 freeze; no final negative is inferred from an immature outcome.',
        );
    }
  });
}
export default {
  id: 'temporal-protocol',
  draw: drawTemporalProtocol,
  cues: [
    'temporal-rows',
    'temporal-clocks',
    'temporal-windows',
    'temporal-freeze',
    'temporal-counts',
    'temporal-pending',
  ],
};
