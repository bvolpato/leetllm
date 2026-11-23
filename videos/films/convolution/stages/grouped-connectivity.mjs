import {
  chapterCueProgress,
  chapterEquation,
  chapterRule,
  chapterText,
  constructionFocus,
  ownerColor,
  withOpacity,
} from '../defaults.mjs';
export function drawGroupedConnectivity(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const B = (beat, start = 0.08, end = 0.9) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  constructionFocus(ctx, api, 'grouped-connectivity', () => {
    const q =
      currentBeat === 0
        ? B(0)
        : currentBeat > 1
          ? 1
          : chapterCueProgress(ctx, api, 'disconnect-groups');
    const inputs = Array.from(
        {
          length: 4,
        },
        (_, i) => ({
          x: 290,
          y: 355 + i * 145,
          width: 160,
          height: 100,
        }),
      ),
      outputs = Array.from(
        {
          length: 6,
        },
        (_, i) => ({
          x: 1440,
          y: 320 + i * 105,
          width: 160,
          height: 72,
        }),
      );
    chapterText(ctx, api, '4 input channels', 370, 285, 31, themeColors.blue, 'center');
    chapterText(ctx, api, '6 output channels', 1520, 270, 31, themeColors.green, 'center');
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 6; j++) {
        const same = Math.floor(i / 2) === Math.floor(j / 3),
          opacity = currentBeat === 0 ? q : same ? 1 : 1 - q;
        if (opacity > 0)
          withOpacity(ctx, api, opacity, () => {
            const y = same ? (Math.floor(i / 2) === 0 ? 400 : 820) : 365,
              color = same ? ownerColor(ctx, api, Math.floor(i / 2)) : themeColors.muted;
            api.line(ctx, 450, 405 + i * 145, 650, y, color, same ? 2 : 1);
            api.line(ctx, 650, y, 1260, y, color, same ? 2 : 1);
            api.line(ctx, 1260, y, 1440, 356 + j * 105, color, same ? 2 : 1);
          });
      }
    inputs.forEach((x, i) => {
      api.rect(
        ctx,
        x.x,
        x.y,
        x.width,
        x.height,
        themeColors.panel,
        ownerColor(ctx, api, Math.floor(i / 2)),
        3,
        5,
      );
      chapterText(
        ctx,
        api,
        'C' + i,
        x.x + 80,
        x.y + 62,
        34,
        ownerColor(ctx, api, Math.floor(i / 2)),
        'center',
      );
    });
    outputs.forEach((x, i) => {
      api.rect(
        ctx,
        x.x,
        x.y,
        x.width,
        x.height,
        themeColors.panel,
        ownerColor(ctx, api, Math.floor(i / 3)),
        3,
        5,
      );
      chapterText(
        ctx,
        api,
        'F' + i,
        x.x + 80,
        x.y + 48,
        30,
        ownerColor(ctx, api, Math.floor(i / 3)),
        'center',
      );
    });
    if (currentBeat === 0) {
      chapterText(ctx, api, 'groups = 1', 950, 330, 35, themeColors.cyan, 'center');
      chapterEquation(ctx, api, '(N,4,H,W)\\to(N,6,H_o,W_o)', 950, 980, 37, themeColors.ink);
    } else {
      const count = chapterCueProgress(ctx, api, 'group-count');
      chapterText(ctx, api, 'groups = 2', 950, 330, 37, themeColors.cyan, 'center');
      chapterText(ctx, api, 'each F reads 2 channels', 945, 580, 31, themeColors.cyan, 'center');
      if (count === 1 || currentBeat === 2)
        chapterText(ctx, api, '6 × 2 × 9 + 6 = 114', 945, 660, 36, themeColors.green, 'center');
      if (currentBeat === 2) {
        chapterText(
          ctx,
          api,
          'H, W, stride, dilation change placements',
          960,
          900,
          29,
          themeColors.muted,
          'center',
        );
        chapterRule(ctx, api, 'F(C/G)K_hK_w+F', 960, 990, 40);
      }
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'grouped-connectivity',
  draw: drawGroupedConnectivity,
  cues: [
    'grouped-connectivity-b1',
    'grouped-connectivity-b2',
    'disconnect-groups',
    'group-count',
    'grouped-connectivity-b3',
    'parameter-owners',
  ],
};
