import { lerp } from '../arithmetic.mjs';
import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintAsyncDeadline(
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
    const q = cueProgress('async-deadline-deadline', 0);
    withGuardMechanismFocus(ctx, api, 'async-clock', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'One shared deadline · default 3 s',
        960,
        310,
        36,
        themeColors.yellow,
        'center',
      );
      drawGuardMechanismLine(ctx, api, themeColors, 180, 475, 1740, 475, themeColors.muted, 4);
      ['input check', 'generation', 'output check'].forEach((s, i) => {
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          s,
          300 + i * 610,
          410,
          32,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          'center',
        );
      });
      api.circle(ctx, 180 + 1560 * q, 475, 12, themeColors.yellow);
      drawGuardMechanismText(ctx, api, themeColors, '0', 180, 550, 29, themeColors.muted, 'center');
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        '3 s',
        1740,
        550,
        29,
        themeColors.pink,
        'center',
      );
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'async-result',
      cueDone('async-deadline-type', 0)
        ? 'Only validated sanitized text may leave the wrapper'
        : 'Validate guard result + expected sanitized-text type',
      960,
      735,
      36,
      themeColors.cyan,
      'center',
    );
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Input, model and output review spend the same budget',
    );
  } else if (currentBeat === 1) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'async-count',
      'Two requests, two model-call counts',
      [
        'Input failure: ConnectionError',
        cueDone('async-deadline-zero', 1) ? 'model calls: 0' : 'model calls: ?',
        'Output review: hangs on Event.wait()',
        cueDone('async-deadline-one', 1) ? 'model calls: 1 · PRIVATE DRAFT' : 'model calls: ?',
      ],
      155,
      300,
      1610,
      360,
      themeColors.blue,
      34,
    );
    withGuardMechanismFocus(ctx, api, 'async-release', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Output-timeout test overrides deadline to 0.01 s',
        185,
        740,
        30,
        themeColors.yellow,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        cueDone('async-deadline-held', 1)
          ? 'Caller: Blocked: deadline · private draft HELD'
          : 'Caller response pending',
        960,
        860,
        38,
        themeColors.pink,
        'center',
      );
    });
  } else {
    const q = cueProgress('async-deadline-cancel', 2);
    withGuardMechanismFocus(ctx, api, 'async-cancel', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'waiting async task',
        170,
        350,
        35,
        themeColors.blue,
      );
      drawGuardMechanismLine(ctx, api, themeColors, 650, 335, 1050, 335, themeColors.pink, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'CancelledError propagates' : 'cooperative cancellation',
        1150,
        350,
        34,
        themeColors.pink,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'blocking thread / already-dispatched remote work',
        170,
        600,
        34,
        themeColors.yellow,
      );
      const x = lerp(250, 1650, q);
      drawGuardMechanismLine(ctx, api, themeColors, 250, 710, x, 710, themeColors.yellow, 5);
      api.circle(ctx, x, 710, 12, themeColors.yellow);
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'async-scope',
      'The executor can report the outcome of work already sent.',
      960,
      900,
      32,
      themeColors.pink,
      'center',
    );
  }
}
export function drawAsyncDeadline(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintAsyncDeadline(ctx, scene, state, api, themeColors, currentBeat, cueProgress, cueDone);
}
export default {
  id: 'async-deadline',
  draw: drawAsyncDeadline,
  cues: [
    'async-deadline-deadline',
    'async-deadline-type',
    'async-deadline-zero',
    'async-deadline-one',
    'async-deadline-held',
    'async-deadline-cancel',
    'async-deadline-effect',
  ],
};
