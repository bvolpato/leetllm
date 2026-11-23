import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintFallbackPolicy(
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
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'fallback-text',
      'Public fallback',
      ['A required check is unavailable.', 'Use the admitted read-only alternative.'],
      155,
      300,
      1610,
      230,
      themeColors.green,
      37,
    );
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'fallback-effect',
      'Private state retained on the host',
      ['unreviewed draft: HELD', 'deployment: HELD pending required authorization'],
      155,
      630,
      1610,
      210,
      themeColors.pink,
      35,
    );
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'No private draft, credential, or evasion threshold is exposed in the explanation',
    );
  } else {
    withGuardMechanismFocus(ctx, api, 'fallback-tests', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Two independent error directions',
        960,
        310,
        35,
        themeColors.cyan,
        'center',
      );
      ['unsafe request escapes', 'safe request blocked'].forEach((s, i) => {
        const y = 420 + i * 180;
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          s,
          190,
          y,
          36,
          i ? themeColors.yellow : themeColors.pink,
        );
        drawGuardMechanismLine(
          ctx,
          api,
          themeColors,
          780,
          y - 12,
          1680,
          y - 12,
          themeColors.muted,
          3,
        );
        const q = cueProgress('fallback-policy-cases', 1);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          q === 1 ? 'preserve reviewed failure' : 'test pending',
          1130,
          y - 45,
          30,
          themeColors.ink,
        );
      });
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'fallback-repair',
      cueDone('fallback-policy-repair', 1)
        ? 'Repair the failed boundary, retain required checks'
        : 'Replay type, timeout, stale approval, injection and unsupported-fact cases',
      960,
      875,
      32,
      themeColors.green,
      'center',
    );
  }
}
export function drawFallbackPolicy(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintFallbackPolicy(
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
  id: 'fallback-policy',
  draw: drawFallbackPolicy,
  cues: [
    'fallback-policy-fallback',
    'fallback-policy-held',
    'fallback-policy-cases',
    'fallback-policy-repair',
  ],
};
