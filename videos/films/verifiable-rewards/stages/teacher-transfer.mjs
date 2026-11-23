import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawHeading, drawRectangle, drawText } from '../defaults.mjs';
export function drawTeacherTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue teacher-transfer/' + id);
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
    cueProgress('vr-' + name + '-' + 'teacher-transfer', beat);
  const paint = () => {
    drawHeading(
      ctx,
      api,
      'Teacher supervision and executable-reward policy updates use different signals',
    );
    const online = currentBeat === 0 && operationProgress('online', 0) > 0;
    if (currentBeat !== 2) {
      drawCell(
        ctx,
        api,
        online ? 'candidate policy' : 'teacher response',
        230,
        430,
        520,
        100,
        themeColors.blue,
        33,
      );
      api.arrow(ctx, 770, 480, 960, 480, themeColors.muted, 4);
      drawCell(
        ctx,
        api,
        online ? 'executable verifier' : 'student token loss',
        990,
        430,
        710,
        100,
        themeColors.cyan,
        33,
      );
      if (currentBeat >= 1 && operationProgress('800k', 1) > 0) {
        drawCell(ctx, api, '600k reasoning', 230, 650, 550, 90, themeColors.blue);
        drawCell(ctx, api, '200k general', 1150, 650, 550, 90, themeColors.green);
        drawText(
          ctx,
          api,
          'Combined 800k teacher-derived examples',
          960,
          830,
          33,
          themeColors.ink,
          'center',
        );
      }
    }
    if (currentBeat === 2) {
      drawRectangle(ctx, api, 190, 350, 1540, 520, themeColors.blue);
      drawText(
        ctx,
        api,
        'Reported Table 6 · AIME pass@1',
        960,
        410,
        34,
        themeColors.blue,
        'center',
      );
      [
        ['distilled Qwen-32B', 72.6, 'distilled', themeColors.green],
        ['direct RL comparison', 47, 'direct', themeColors.yellow],
      ].forEach(([s, v, key, color], i) => {
        const y = 560 + i * 180;
        drawText(ctx, api, s, 240, y, 31, color);
        if (operationProgress(key, 2) > 0) {
          api.rect(ctx, 760, y - 45, v * 10, 65, themeColors.panel, color, 3);
          drawText(ctx, api, v.toFixed(1) + '%', 1620, y, 33, color, 'center');
        }
      });
    }
    drawFooter(
      ctx,
      api,
      'Total cost includes teacher generation, filtering, verification and student training.',
    );
  };
  api.focus.target('teacher-transfer-mechanism', paint);
}
export default {
  id: 'teacher-transfer',
  draw: drawTeacherTransfer,
  cues: [
    'vr-teacher-transfer-b0',
    'vr-supervised-teacher-transfer',
    'vr-online-teacher-transfer',
    'vr-teacher-transfer-b1',
    'vr-800k-teacher-transfer',
    'vr-teacher-transfer-b2',
    'vr-distilled-teacher-transfer',
    'vr-direct-teacher-transfer',
  ],
};
