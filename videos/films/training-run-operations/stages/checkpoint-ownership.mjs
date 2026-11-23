import { clamp, motion } from '../arithmetic.mjs';
import { trainingCompleted, trainingCue } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawCheckpointOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    q = motion(progress);
  api.focus.target('checkpoint-ownership-mechanism', () => {
    if (beat === 0) {
      const applied = trainingCompleted(state, 'snapshot-value', progress > 0.55),
        w = applied ? 1 - 0.1 * (2 * 1) : 1;
      drawLine(ctx, api, 380, 430, 660, 625, themeColors.blue, 4);
      drawLine(ctx, api, 900, 430, 660, 625, themeColors.cyan, 4);
      drawLine(ctx, api, 1470, 430, 1470, 625, themeColors.yellow, 4);
      drawCell(ctx, api, 'live weight', 180, 340, 400, 90, themeColors.blue, 31);
      drawCell(ctx, api, 'state_dict', 700, 340, 400, 90, themeColors.cyan, 31);
      drawCell(ctx, api, 'deep copy', 1270, 340, 400, 90, themeColors.yellow, 31);
      drawBox(ctx, api, 420, 625, 480, 170, themeColors.cyan);
      drawText(ctx, api, 'shared storage S0', 660, 680, 31, themeColors.cyan, 'center');
      drawText(ctx, api, w.toFixed(3), 660, 755, 50, themeColors.cyan, 'center', 'mono');
      drawBox(ctx, api, 1230, 625, 480, 170, themeColors.yellow);
      drawText(ctx, api, 'independent S1', 1470, 680, 31, themeColors.yellow, 'center');
      drawText(ctx, api, '1.000', 1470, 755, 50, themeColors.yellow, 'center', 'mono');
      drawText(
        ctx,
        api,
        'loss w² → gradient 2w → SGD η = 0.1',
        960,
        900,
        36,
        themeColors.ink,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'The dictionary retains a reference; the deep copy retains the earlier value. Neither is a durable save.',
      );
    } else if (beat === 1) {
      const stage =
          0.6 * trainingCue(state, 'snapshot-background', clamp(q * 2)) +
          0.4 * trainingCue(state, 'checkpoint-ownership-step-2', clamp(q * 3 - 1)),
        upload = trainingCue(state, 'snapshot-upload', clamp(q * 3 - 2)),
        x = 350,
        w = 1330;
      drawText(
        ctx,
        api,
        'Supplied asynchronous save state',
        960,
        280,
        36,
        themeColors.blue,
        'center',
      );
      drawText(ctx, api, 'Host staging', 150, 425, 25, themeColors.yellow);
      drawText(ctx, api, 'Storage upload', 150, 655, 25, themeColors.cyan);
      drawBox(ctx, api, x, 355, w, 110, themeColors.muted);
      api.rect(ctx, x + 4, 359, (w - 8) * stage, 102, themeColors.yellow, undefined, 0);
      drawText(
        ctx,
        api,
        stage === 1 ? 'STAGING COMPLETE' : 'COPY PENDING',
        1020,
        520,
        32,
        themeColors.yellow,
        'center',
      );
      drawBox(ctx, api, x, 585, w, 110, themeColors.muted);
      if (upload > 0)
        api.rect(ctx, x + 4, 589, (w - 8) * upload, 102, themeColors.cyan, undefined, 0);
      drawText(
        ctx,
        api,
        upload === 1
          ? 'UPLOAD COMPLETE'
          : upload > 0
            ? 'WRITING STABLE COPY'
            : 'WAIT FOR STAGED VALUES',
        1020,
        655,
        30,
        upload > 0.5 ? themeColors.bg : themeColors.ink,
        'center',
      );
      const mutable = stage === 1;
      drawText(
        ctx,
        api,
        mutable
          ? 'Live state may advance under this supported API'
          : 'Saved values must stay stable while copy is pending',
        960,
        820,
        35,
        mutable ? themeColors.green : themeColors.pink,
        'center',
      );
      drawText(
        ctx,
        api,
        'weights · buffers · RNG · loader state',
        960,
        925,
        30,
        themeColors.muted,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'Two completion events · optional background staging does not turn a pending copy into a snapshot.',
      );
    } else {
      const count = Math.floor(4 * trainingCue(state, 'checkpoint-ownership-step-3', q)),
        publish = count === 4 && trainingCompleted(state, 'snapshot-publish', progress > 0.6);
      drawText(
        ctx,
        api,
        'Checkpoint C1841 · one boundary',
        960,
        285,
        37,
        themeColors.cyan,
        'center',
      );
      ['model shard', 'optimizer shard', 'data + RNG', 'progress + manifest'].forEach((v, i) => {
        const x = 170 + i * 420;
        drawBox(ctx, api, x, 365, 375, 175, i < count ? themeColors.cyan : themeColors.muted);
        drawText(
          ctx,
          api,
          v,
          x + 187.5,
          430,
          27,
          i < count ? themeColors.cyan : themeColors.muted,
          'center',
        );
        drawText(
          ctx,
          api,
          i < count ? 'VALIDATED' : 'PENDING',
          x + 187.5,
          500,
          28,
          i < count ? themeColors.green : themeColors.yellow,
          'center',
        );
      });
      drawText(
        ctx,
        api,
        `Complete artifacts: ${count} / 4`,
        960,
        650,
        36,
        count === 4 ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawBox(ctx, api, 490, 745, 940, 145, publish ? themeColors.green : themeColors.yellow);
      drawText(ctx, api, 'durable pointer', 960, 795, 28, themeColors.muted, 'center');
      drawText(
        ctx,
        api,
        publish ? 'C1841' : 'C1840',
        960,
        860,
        48,
        publish ? themeColors.green : themeColors.yellow,
        'center',
        'mono',
      );
      drawFooter(
        ctx,
        api,
        'Validate the complete manifest before replacing the pointer; loading validates it again.',
      );
    }
  });
}
export default {
  id: 'checkpoint-ownership',
  draw: drawCheckpointOwnership,
  cues: [
    'checkpoint-ownership-step-1',
    'snapshot-alias',
    'snapshot-copy',
    'snapshot-update',
    'snapshot-value',
    'checkpoint-ownership-step-2',
    'snapshot-background',
    'snapshot-wait',
    'snapshot-upload',
    'checkpoint-ownership-step-3',
    'snapshot-artifacts',
    'snapshot-publish',
  ],
};
