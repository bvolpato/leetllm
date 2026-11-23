import { vrBound } from '../arithmetic.mjs';
import {
  drawCell,
  drawFooter,
  drawHeading,
  drawLine,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawMeasurementStatus(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue measurement-status/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'measurement-status', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'The same rollout identity stays attached to its measurement');
    const active = currentBeat === 0 ? 0 : operationProgress('quarantine', 1),
      retry = operationProgress('retry', 1),
      items = [
        ['R1', 'correct', 1, themeColors.green],
        ['R2', 'wrong', 0, themeColors.pink],
        ['R3', 'candidate timeout', 0, themeColors.pink],
        ['R4', 'host crash', null, themeColors.yellow],
      ];
    items.forEach(([id, label, reward, color], i) => {
      if (currentBeat === 2 && i < 2) return;
      const x = 220 + i * 390,
        y = currentBeat === 2 ? 690 : 430 + (i === 3 ? active * 285 : 0);
      drawCell(ctx, api, id, x, y, 320, 70, color);
      drawText(ctx, api, label, x + 160, y + 120, 27, color, 'center');
      if (i < 3 && resultComplete('zero', 0))
        drawText(ctx, api, 'reward ' + reward, x + 160, y + 195, 31, color, 'center');
      if (i === 3 && resultComplete('unscored', 0))
        drawText(ctx, api, 'UNSCORED', x + 160, y + 195, 30, themeColors.yellow, 'center');
    });
    if (active > 0 && currentBeat !== 2) {
      if (resultComplete('quarantine', 1))
        drawLine(ctx, api, 170, 680, 1750, 680, themeColors.yellow, 2);
      drawText(
        ctx,
        api,
        'QUARANTINE · excluded from reward vector',
        210,
        940,
        28,
        themeColors.yellow,
      );
      drawText(ctx, api, '[ 1, 0, 0 ]', 690, 870, 40, themeColors.blue, 'center');
    }
    if (retry > 0 && currentBeat !== 2) {
      api.arrow(ctx, 1730, 805, 1730, 595, themeColors.yellow, 4);
      drawText(ctx, api, 'bounded retry', 1110, 850, 25, themeColors.yellow);
      drawText(ctx, api, 'same R4 candidate', 1110, 895, 25, themeColors.yellow);
    }
    if (currentBeat === 2 && operationProgress('adversarial', 2) > 0) {
      drawText(ctx, api, 'Group rewards', 240, 755, 30, themeColors.muted);
      drawText(ctx, api, '[ 1, 0, 0 ]', 240, 850, 60, themeColors.blue);
      drawRectangle(ctx, api, 180, 355, 1560, 265, themeColors.cyan);
      drawText(ctx, api, 'Checker fixtures → expected routing', 220, 400, 30, themeColors.cyan);
      [
        'duplicate field → 0',
        'invalid gold → unscored',
        'host crash → unscored',
        'candidate timeout → 0',
      ].forEach((s, i) =>
        drawText(
          ctx,
          api,
          s,
          230 + (i % 2) * 770,
          465 + Math.floor(i / 2) * 85,
          28,
          themeColors.ink,
        ),
      );
    }
    drawFooter(ctx, api, 'The group mean uses the measured rewards.');
  };
  api.focus.target('measurement-status-mechanism', paint);
}
export default {
  id: 'measurement-status',
  draw: drawMeasurementStatus,
  cues: [
    'vr-measurement-status-b0',
    'vr-zero-measurement-status',
    'vr-unscored-measurement-status',
    'vr-measurement-status-b1',
    'vr-quarantine-measurement-status',
    'vr-retry-measurement-status',
    'vr-measurement-status-b2',
    'vr-adversarial-measurement-status',
  ],
};
