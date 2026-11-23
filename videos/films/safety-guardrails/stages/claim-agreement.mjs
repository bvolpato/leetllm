import { lerp } from '../arithmetic.mjs';
import { claimAgreement, guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismLabel,
  drawGuardMechanismRect,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintClaimAgreement(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  const repeated = currentBeat === 2,
    rows = repeated
      ? [['2 hours'], ['2 hours'], ['2 hours']]
      : [['manager'], ['manager', 'freeze'], ['security-admin']],
    a = claimAgreement(rows);
  const selected = repeated
      ? cueDone('claim-agreement-repeat', 2)
      : cueDone('claim-agreement-zero', 1),
    align = repeated
      ? cueProgress('claim-agreement-repeat', 2)
      : cueProgress('claim-agreement-align', 1),
    ids = repeated ? ['2 hours'] : ['manager', 'freeze', 'security-admin'];
  withGuardMechanismFocus(ctx, api, repeated ? 'agreement-repeated' : 'agreement-sets', () => {
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      repeated
        ? 'How long is the rollback window?'
        : 'What does restoring production API access require?',
      170,
      280,
      31,
      themeColors.cyan,
    );
    rows.forEach((row, i) => {
      const y = 355 + i * 110;
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'response ' + (i + 1),
        170,
        y + 40,
        28,
        themeColors.muted,
      );
      row.forEach((id, j) => {
        const column = ids.indexOf(id),
          x = lerp(470 + j * 430, 470 + column * 430, align),
          color = [themeColors.blue, themeColors.yellow, themeColors.pink][column];
        drawGuardMechanismRect(ctx, api, themeColors, x, y, 390, 75, color);
        drawGuardMechanismText(ctx, api, themeColors, id, x + 195, y + 49, 29, color, 'center');
      });
    });
  });
  withGuardMechanismFocus(ctx, api, 'agreement-ratio', () => {
    if (cueProgress('claim-agreement-ratio', 0) > 0) {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'present in every row?',
        170,
        750,
        28,
        themeColors.green,
      );
      ids.forEach((id, i) => {
        const x = 470 + i * 430,
          count = rows.filter((row) => row.includes(id)).length,
          color = [themeColors.blue, themeColors.yellow, themeColors.pink][i];
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          selected ? count + '/3' : '?',
          x + 195,
          750,
          30,
          selected && count === 3 ? themeColors.green : themeColors.muted,
          'center',
        );
        if (align > 0) api.rect(ctx, x, 805, 390 * align, 55, color);
      });
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'union: each ID once',
        170,
        845,
        28,
        themeColors.cyan,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        selected
          ? 'intersection ' + a.intersection.length + ' / union ' + a.union.length + ' = ' + a.score
          : 'intersection / union: ?',
        960,
        925,
        37,
        themeColors.yellow,
        'center',
      );
    }
  });
  if (currentBeat === 0 || (currentBeat === 1 && cueProgress('claim-agreement-meaning', 1) > 0))
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'agreement-scope',
      currentBeat === 1
        ? 'Could the runbook require both approvals?'
        : 'Single response: unavailable · empty union: unavailable',
      960,
      990,
      27,
      themeColors.muted,
      'center',
    );
  withGuardMechanismFocus(ctx, api, 'agreement-source', () => {
    if (repeated)
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Which rollback window does the runbook give?',
        960,
        990,
        28,
        themeColors.pink,
        'center',
      );
  });
}
export function drawClaimAgreement(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintClaimAgreement(
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
  id: 'claim-agreement',
  draw: drawClaimAgreement,
  cues: [
    'claim-agreement-sets',
    'claim-agreement-ratio',
    'claim-agreement-align',
    'claim-agreement-zero',
    'claim-agreement-meaning',
    'claim-agreement-repeat',
    'claim-agreement-source',
  ],
};
