import { kernelChapterFrame } from '../construction.mjs';
import { drawArrow, drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawShadowBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('shadow-budget', state),
    colors = [
      themeColors.blue,
      themeColors.cyan,
      themeColors.pink,
      themeColors.green,
      themeColors.yellow,
    ];
  api.focus.target('shadow-budget-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Trusted output still serves while the candidate is compared',
        'Same request R1 · candidate result remains outside the response',
      );
      drawRow(ctx, api, ['R1 input A'], 260, 460, 450, themeColors.blue);
      drawRow(ctx, api, ['trusted result'], 1200, 400, 500, themeColors.green);
      drawRow(ctx, api, ['candidate result'], 1200, 680, 500, themeColors.cyan);
      drawArrow(ctx, api, 740, 495, 1160, 435, themeColors.green);
      drawArrow(ctx, api, 740, 495, 1160, 715, themeColors.cyan);
      drawChapterText(ctx, api, 'USER', 1590, 355, 30, themeColors.green, 'center');
      if (progress > 0.55)
        drawChapterText(ctx, api, 'compare only', 1450, 850, 31, themeColors.cyan, 'center');
      drawNote(ctx, api, 'Copying sampled tensors requires approved privacy and retention scope');
    } else if (currentBeat === 1) {
      const full = at('capacity', 1);
      drawTitle(
        ctx,
        api,
        'Which shadow jobs fit?',
        'Ten slots, one job per slot',
      );
      for (let i = 0; i < 10; i++) {
        const x = 260 + (i % 5) * 285,
          y = 445 + Math.floor(i / 5) * 145;
        api.rect(
          ctx,
          x,
          y,
          220,
          100,
          themeColors.panel,
          i < 8 ? themeColors.blue : themeColors.muted,
          2,
          7,
        );
        drawChapterText(
          ctx,
          api,
          i < 8 ? 'service' : full ? 'shadow S' + (i - 7) : 'free',
          x + 110,
          y + 61,
          31,
          i < 8 ? themeColors.blue : themeColors.muted,
          'center',
        );
      }
      drawRow(
        ctx,
        api,
        full ? ['S3 waits for a slot'] : ['shadow S1', 'shadow S2', 'shadow S3'],
        320,
        800,
        1260,
        full ? themeColors.pink : themeColors.yellow,
      );
      if (full)
        drawChapterText(
          ctx,
          api,
          '8 service jobs + 2 shadow jobs = 10 slots',
          960,
          365,
          37,
          themeColors.pink,
          'center',
        );
      drawNote(
        ctx,
        api,
        'A second stream shares compute, bandwidth, cache and allocator capacity',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Repeat the same workload before calling retention a leak',
        'Supplied instrument worksheet · each reading keeps its own unit',
      );
      const names = [
          'live tensors',
          'allocator reserve',
          'workspace',
          'host memory',
          'specializations',
        ],
        values = ['2 MiB', '4 MiB', '1 MiB', '8 MiB', '3 artifacts'];
      names.forEach((name, i) => {
        const y = 400 + i * 100;
        drawChapterText(ctx, api, name, 260, y + 35, 29, colors[i]);
        drawRow(
          ctx,
          api,
          [values[i], progress > 0.5 ? values[i] : 'repeat?'],
          800,
          y - 5,
          850,
          colors[i],
        );
      });
      drawChapterText(
        ctx,
        api,
        progress > 0.5
          ? 'Same workload    ·    Reserve 4 → 4 MiB    ·    Artifacts 3 → 3'
          : 'before → replay the identical workload → after',
        960,
        935,
        30,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'High-water reserve alone is not a leak · compatible new shapes can reuse an existing specialization',
      );
    }
  });
}
export default {
  id: 'shadow-budget',
  draw: drawShadowBudget,
  cues: [
    'kg-shadow-budget-voice-0',
    'kg-shadow-budget-voice-1',
    'kg-shadow-budget-capacity',
    'kg-shadow-budget-voice-2',
  ],
};
