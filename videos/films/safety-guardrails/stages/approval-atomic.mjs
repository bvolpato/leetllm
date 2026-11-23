import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismLine,
  drawGuardMechanismRect,
  drawGuardMechanismStatus,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintApprovalAtomic(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  if (currentBeat === 0) {
    withGuardMechanismFocus(ctx, api, 'atomic-race', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Separate read / then write · race',
        960,
        300,
        34,
        themeColors.pink,
        'center',
      );
      ['worker A', 'worker B'].forEach((s, i) => {
        const y = 390 + i * 155;
        drawGuardMechanismText(ctx, api, themeColors, s, 190, y, 31, themeColors.blue);
        drawGuardMechanismLine(ctx, api, themeColors, 420, y, 1670, y, themeColors.muted);
        const q = cueProgress('approval-atomic-race', 0);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          q === 1 ? 'read: UNUSED' : 'read pending',
          660,
          y - 30,
          31,
          themeColors.yellow,
        );
        if (q === 1)
          drawGuardMechanismText(
            ctx,
            api,
            themeColors,
            'both could start',
            1340,
            y - 30,
            30,
            themeColors.pink,
          );
      });
    });
    withGuardMechanismFocus(ctx, api, 'atomic-reservation', () => {
      const q = cueProgress('approval-atomic-reserve', 0);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'One durable unique reservation',
        960,
        750,
        33,
        themeColors.cyan,
        'center',
      );
      drawGuardMechanismRect(ctx, api, themeColors, 390, 805, 1140, 100, themeColors.cyan);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        q === 1
          ? 'A owns (deploy-op-42, approved payload); B finds that record'
          : 'atomic insert keyed by scoped operation + payload',
        960,
        870,
        30,
        q === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
    });
  } else {
    withGuardMechanismFocus(ctx, api, 'atomic-unknown', () => {
      drawGuardMechanismText(ctx, api, themeColors, 'Host', 225, 330, 34, themeColors.blue);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Remote executor',
        1370,
        330,
        34,
        themeColors.cyan,
      );
      drawGuardMechanismArrow(ctx, api, themeColors, 410, 410, 1430, 410, themeColors.cyan);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'same idempotency key + same payload',
        630,
        380,
        30,
        themeColors.cyan,
      );
      drawGuardMechanismRect(ctx, api, themeColors, 1390, 465, 300, 125, themeColors.green);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'effect may run',
        1540,
        540,
        29,
        themeColors.green,
        'center',
      );
      drawGuardMechanismLine(ctx, api, themeColors, 1400, 650, 510, 650, themeColors.pink, 3);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'response lost / timeout',
        675,
        700,
        31,
        themeColors.pink,
      );
      drawGuardMechanismStatus(
        ctx,
        api,
        themeColors,
        'atomic-unknown',
        cueDone('approval-atomic-timeout', 1) ? 'Outcome: UNKNOWN' : 'Outcome: awaiting response',
        150,
        770,
        660,
        themeColors.yellow,
      );
    });
    withGuardMechanismFocus(ctx, api, 'atomic-reconcile', () => {
      const q = cueProgress('approval-atomic-reconcile', 1);
      if (q > 0) {
        drawGuardMechanismArrow(ctx, api, themeColors, 900, 840, 1320, 840, themeColors.yellow);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'query / reconcile',
          1370,
          850,
          32,
          themeColors.yellow,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'then retry only within executor contract',
          960,
          945,
          30,
          themeColors.muted,
          'center',
        );
      }
    });
  }
}
export function drawApprovalAtomic(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintApprovalAtomic(
    ctx,
    scene,
    state,
    api,
    themeColors,
    currentBeat,
    cueProgress,
    cueDone,
  );
}
export default {
  id: 'approval-atomic',
  draw: drawApprovalAtomic,
  cues: [
    'approval-atomic-race',
    'approval-atomic-reserve',
    'approval-atomic-timeout',
    'approval-atomic-reconcile',
  ],
};
