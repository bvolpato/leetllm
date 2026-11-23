import {
  drawChapterBar,
  drawChapterFooter,
  drawChapterLine,
  drawChapterRectangle,
  drawChapterTag,
  drawChapterText,
} from '../defaults.mjs';
export function drawBatchRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-batch-recovery-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-batch-recovery-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(ctx, api, 'Internal task deadline: 48 hours', 960, 325, 37, themeColors.ink);
      const x = 240,
        w = 1440;
      drawChapterLine(ctx, api, x, 550, x + w, 550, themeColors.muted, 4);
      for (const hour of [0, 24, 28, 48]) {
        const px = x + (w * hour) / 48;
        drawChapterLine(ctx, api, px, 520, px, 580, themeColors.muted, 2);
        drawChapterText(ctx, api, hour + ' h', px, 635, 30, themeColors.ink);
      }
      drawChapterBar(ctx, api, x, 420, w * 0.5, 70, u, themeColors.blue);
      drawChapterBar(ctx, api, x + w * 0.5, 420, (w * 4) / 48, 70, u, themeColors.yellow);
      drawChapterText(ctx, api, '24 h provider window', 600, 375, 30, themeColors.blue);
      drawChapterText(ctx, api, '4 h reserve', 1240, 460, 28, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        'Noninteractive + supported model/endpoint + sufficient deadline',
        960,
        790,
        29,
        themeColors.yellow,
      );
      if (done)
        drawChapterText(
          ctx,
          api,
          'Estimate $2.82 warm · $5.70 cold',
          960,
          920,
          38,
          themeColors.green,
        );
    } else {
      for (let i = 0; i < 10; i++) {
        const x = 200 + (i % 5) * 325,
          y = 365 + Math.floor(i / 5) * 215,
          completed = i < 6,
          recovered = currentBeat === 1 ? api.clamp(u * 4 - (i - 6)) : 0;
        drawChapterRectangle(
          ctx,
          api,
          x,
          y,
          230,
          105,
          completed ? themeColors.green : themeColors.pink,
        );
        drawChapterText(
          ctx,
          api,
          'Job ' + (i + 1),
          x + 115,
          y + 40,
          29,
          completed ? themeColors.green : themeColors.pink,
        );
        drawChapterText(
          ctx,
          api,
          completed ? 'COMPLETE' : 'EXPIRED',
          x + 115,
          y + 83,
          22,
          completed ? themeColors.green : themeColors.pink,
        );
        if (!completed) {
          const copyProgress = currentBeat === 1 ? api.clamp(((u - 0.25) / 0.75) * 4 - (i - 6)) : 1,
            visible = currentBeat > 1 || u > 0.25 + ((i - 6) * 0.75) / 4;
          if (visible) {
            const yy = currentBeat === 1 ? 700 + 145 * copyProgress : 845 - 85 * api.clamp(u / 0.3);
            drawChapterLine(ctx, api, x + 115, y + 116, x + 115, yy - 8, themeColors.yellow, 2);
            drawChapterRectangle(ctx, api, x + 25, yy, 180, 48, themeColors.yellow);
            drawChapterText(ctx, api, 'Job ' + (i + 1), x + 115, yy + 33, 24, themeColors.yellow);
          }
        }
      }
      drawChapterText(
        ctx,
        api,
        currentBeat === 1
          ? 'Six completed receipts remain billable; recover only four missing outcomes'
          : 'Recovery needs remaining deadline, cold-path budget and eligible service',
        960,
        935,
        29,
        themeColors.yellow,
      );
      if (currentBeat === 2 && u > 0.4) {
        drawChapterTag(ctx, api, '3 h remaining', 550, 875, themeColors.pink);
        drawChapterTag(ctx, api, 'Internal reserve 4 h', 1370, 875, themeColors.yellow, 640);
      }
    }
    drawChapterFooter(
      ctx,
      api,
      'Authored ten-job expiry illustration. A window is not guaranteed useful completion.',
    );
  });
}
export default {
  id: 'batch-recovery',
  draw: drawBatchRecovery,
  cues: ['te-batch-recovery-0', 'te-batch-recovery-1', 'te-batch-recovery-2'],
};
