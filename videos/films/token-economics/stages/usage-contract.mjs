import {
  drawChapterBar,
  drawChapterFooter,
  drawChapterRectangle,
  drawChapterTag,
  drawChapterText,
} from '../defaults.mjs';
export function drawUsageContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-usage-contract-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-usage-contract-mechanism', () => {
    const x = 240,
      y = 430,
      w = 1440;
    drawChapterText(
      ctx,
      api,
      currentBeat === 2
        ? 'Provider fields have different boundaries'
        : 'One disjoint input total · 1,800 tokens',
      960,
      315,
      36,
      themeColors.yellow,
    );
    if (currentBeat === 2) {
      const items = [
        ['Anthropic ordinary', 520, themeColors.cyan],
        ['Separate cache reads', 1280, themeColors.yellow],
      ];
      items.forEach((r, i) => {
        drawChapterText(ctx, api, r[0], 450, 430 + i * 220, 30, r[2]);
        drawChapterRectangle(ctx, api, 760, 380 + i * 220, 850, 80, r[2]);
        drawChapterBar(ctx, api, 760, 380 + i * 220, 850, 80, (r[1] / 1800) * u, r[2]);
        drawChapterText(ctx, api, r[1] + ' tokens', 1420, 515 + i * 220, 30, r[2]);
      });
      if (done)
        drawChapterText(
          ctx,
          api,
          '520 + 1,280 = 1,800 total input',
          960,
          905,
          39,
          themeColors.green,
        );
    } else {
      const ordinary = 520,
        read = 1280;
      drawChapterRectangle(ctx, api, x, y, w, 100, themeColors.muted, 'transparent');
      api.components.fade(u, () => {
        drawChapterBar(ctx, api, x, y, (w * ordinary) / 1800, 100, 1, themeColors.cyan);
        api.rect(
          ctx,
          x + (w * ordinary) / 1800,
          y,
          (w * read) / 1800,
          100,
          themeColors.yellow,
          undefined,
          0,
        );
      });
      drawChapterText(ctx, api, '520 ordinary', 450, 620, 32, themeColors.cyan);
      drawChapterText(ctx, api, '1,280 reads · 0 writes', 1260, 620, 32, themeColors.yellow);
      if (currentBeat === 0) {
        drawChapterText(
          ctx,
          api,
          'total − reads − writes = ordinary',
          960,
          775,
          37,
          themeColors.ink,
        );
        if (done)
          drawChapterText(
            ctx,
            api,
            'Input categories sum to exactly 1,800',
            960,
            900,
            32,
            themeColors.green,
          );
      } else {
        drawChapterTag(
          ctx,
          api,
          u < 0.5 ? 'count = true' : 'count = 1',
          520,
          795,
          u < 0.5 ? themeColors.pink : themeColors.cyan,
        );
        drawChapterTag(
          ctx,
          api,
          u < 0.5 ? 'REJECT Boolean count' : 'REQUIRE exact integer type',
          1400,
          795,
          u < 0.5 ? themeColors.pink : themeColors.green,
          610,
        );
        drawChapterText(
          ctx,
          api,
          'Reasoning ≤ output · reads + writes ≤ total · rates finite and nonnegative',
          960,
          935,
          27,
          themeColors.yellow,
        );
      }
    }
    drawChapterFooter(ctx, api, 'Normalize provider semantics before applying a rate card.');
  });
}
export default {
  id: 'usage-contract',
  draw: drawUsageContract,
  cues: ['te-usage-contract-0', 'te-usage-contract-1', 'te-usage-contract-2'],
};
