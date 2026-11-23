import { boundedContext, contextDone } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawSkillRoutingAndSafety(ctx, scene, state, api) {
  if (paintSkillRoutingAndSafety(ctx, scene, state, api)) return;
}
function paintSkillRoutingAndSafety(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-skill-routing-and-safety-mechanism', () => {
    drawCompleteHeading(
      ctx,
      api,
      'Activation, procedure result and external authority have separate outcomes',
    );
    const rows = [
      ['canary investigation', 'ce-skill-investigation', 'activate', themeColors.blue],
      ['vacation-policy summary', 'ce-skill-vacation', 'leave unloaded', themeColors.muted],
      ['request rollback', 'ce-skill-proposal', 'activate; proposal only', themeColors.yellow],
    ];
    rows.forEach(([request, cue, outcome, color], i) => {
      const y = 385 + i * 180,
        known = currentBeat > 0 || resultComplete(cue, 0);
      drawCompleteRecord(ctx, api, request, 'incoming request', 150, y, 650, color, 100);
      drawCompleteLine(ctx, api, 830, y + 50, 1000, y + 50, themeColors.muted, 2);
      drawCompleteRecord(
        ctx,
        api,
        known ? outcome : 'routing pending',
        i === 2 && known ? 'no-write fixture:0 effects' : 'incident-skill trigger',
        1050,
        y,
        690,
        known ? color : themeColors.muted,
        100,
      );
    });
    if (currentBeat === 1)
      drawCompleteText(
        ctx,
        api,
        'Valid output does not grant rollback permission',
        150,
        1000,
        34,
        themeColors.pink,
      );
    if (currentBeat === 2)
      drawCompleteText(
        ctx,
        api,
        'Measure activation errors, rendered units and complete end-to-end work',
        150,
        1000,
        29,
        themeColors.cyan,
      );
    drawCompleteFooter(
      ctx,
      api,
      'Runtime permissions stay outside the procedure text and its activation decision.',
    );
  });
  return true;
}
export default {
  id: 'skill-routing-and-safety',
  draw: drawSkillRoutingAndSafety,
  cues: [
    'ce-skill-routing-and-safety-1',
    'ce-skill-investigation',
    'ce-skill-vacation',
    'ce-skill-proposal',
    'ce-skill-routing-and-safety-2',
    'ce-skill-routing-and-safety-3',
  ],
};
