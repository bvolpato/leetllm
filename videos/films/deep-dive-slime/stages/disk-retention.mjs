import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawDiskRetention(ctx, scene, state, api) {
  return api.focus.target('sl-disk-retention-mechanism', () =>
    paintDiskRetention(ctx, scene, state, api),
  );
}
function paintDiskRetention(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('disk-retention', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(
      ctx,
      api,
      'A prepared export and a committed checkpoint have different lifetimes',
    );
    if (currentBeat < 2) {
      const stages = ['pull', 'pause', 'flush', 'reload', 'check v12', 'remove export', 'resume'];
      stages.forEach((v, i) => {
        const y = 370 + (i % 4) * 125,
          x = i < 4 ? 210 : 1120;
        drawSlimeTile(
          ctx,
          api,
          v,
          x,
          y,
          570,
          i < modelState.stages
            ? modelState.wrongVersion && i >= 4
              ? themeColors.pink
              : themeColors.green
            : themeColors.muted,
          78,
          30,
        );
        drawSlimeText(ctx, api, String(i + 1), x - 45, y + 48, 30, themeColors.cyan);
      });
      if (modelState.wrongVersion)
        drawSlimeTile(
          ctx,
          api,
          'observed 11 ≠ expected 12 · raise before resume',
          430,
          890,
          1150,
          themeColors.pink,
          70,
          30,
        );
    } else {
      const names = ['model weights', 'optimizer', 'scheduler', 'RNG', 'data progress'];
      names.forEach((v, i) => {
        drawSlimeTile(
          ctx,
          api,
          v,
          180,
          365 + i * 110,
          650,
          i === 0 ? themeColors.blue : themeColors.muted,
          76,
          30,
        );
        drawSlimeTile(
          ctx,
          api,
          i === 0
            ? 'supplied by weight export'
            : i < modelState.states
              ? 'requires training-checkpoint state'
              : 'not supplied by weight export',
          1020,
          365 + i * 110,
          700,
          i === 0
            ? themeColors.blue
            : i < modelState.states
              ? themeColors.green
              : themeColors.yellow,
          76,
          28,
        );
      });
    }
    if (!modelState.wrongVersion)
      drawSlimeRule(
        ctx,
        api,
        currentBeat === 2
          ? 'Retaining a weight directory does not retain the complete trainer state'
          : 'Version assertion shown here is the pin’s CI-test branch',
        955,
        themeColors.cyan,
        31,
      );
    drawSlimeNote(
      ctx,
      api,
      'Publish and pull before the live transition · durable storage and access remain explicit',
    );
    return;
  }
}
export default {
  id: 'disk-retention',
  draw: drawDiskRetention,
  cues: [
    'sl-disk-retention-b0-operation',
    'sl-disk-retention-b0-s0',
    'sl-disk-retention-b0-s1',
    'sl-disk-retention-b0-s2',
    'sl-disk-retention-b1-operation',
    'sl-disk-retention-b1-s0',
    'sl-disk-retention-b1-s1',
    'sl-disk-retention-b1-s2',
    'sl-disk-retention-b1-s3',
    'sl-disk-retention-b2-operation',
    'sl-disk-retention-b2-s0',
    'sl-disk-retention-b2-s1',
    'sl-disk-retention-b2-s2',
    'sl-disk-retention-b2-s3',
  ],
};
