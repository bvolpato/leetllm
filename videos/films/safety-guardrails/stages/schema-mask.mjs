import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismLines,
  drawGuardMechanismRect,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintSchemaMask(ctx, scene, state, api, themeColors, currentBeat, cueProgress) {
  const masked = cueProgress('schema-mask-mask', 0),
    parsed = cueProgress('schema-mask-parse', 0);
  if (currentBeat === 0)
    withGuardMechanismFocus(ctx, api, 'schema-choices', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Next token after {"action":',
        170,
        300,
        35,
        themeColors.blue,
      );
      const choices = [
        ['"deploy"', true],
        ['{ malformed structure', false],
        ['"read"', true],
        ['unexpected field syntax', false],
      ];
      choices.forEach(([s, legal], i) => {
        const y = 395 + i * 110;
        drawGuardMechanismLine(ctx, api, themeColors, 530, 330, 730, y, themeColors.muted, 2);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          s,
          780,
          y,
          32,
          legal ? themeColors.cyan : themeColors.pink,
        );
        if (!legal && masked > 0) {
          drawGuardMechanismLine(
            ctx,
            api,
            themeColors,
            750,
            y + 12,
            750 + 520 * masked,
            y + 12,
            themeColors.pink,
            5,
          );
          drawGuardMechanismText(
            ctx,
            api,
            themeColors,
            masked === 1 ? 'masked' : 'masking',
            1430,
            y,
            28,
            themeColors.pink,
          );
        }
      });
    });
  if (currentBeat === 0)
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'schema-parse',
      parsed === 1
        ? 'Completed JSON → parse + supported schema validation'
        : 'Completion, refusal and incomplete-output paths stay explicit',
      960,
      900,
      31,
      themeColors.yellow,
      'center',
    );
  withGuardMechanismFocus(ctx, api, 'schema-valid', () => {
    if (currentBeat === 1) {
      drawGuardMechanismRect(ctx, api, themeColors, 140, 275, 1640, 555, themeColors.blue);
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        [
          'Schema-valid example:',
          '{"action":"deploy","target":"forbidden",',
          ' "approval_id":"invented"}',
        ],
        185,
        340,
        34,
        themeColors.ink,
        95,
        true,
      );
    }
  });
  withGuardMechanismFocus(ctx, api, 'schema-authority', () => {
    if (currentBeat === 1) {
      const q = cueProgress('schema-mask-authority', 1);
      drawGuardMechanismLine(ctx, api, themeColors, 1200, 590, 1720, 590, themeColors.pink, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'Host denies forbidden effect' : 'Required authority check',
        1210,
        665,
        31,
        themeColors.pink,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Citation string ≠ supported claim',
        190,
        760,
        33,
        themeColors.yellow,
      );
    }
  });
}
export function drawSchemaMask(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintSchemaMask(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
}
export default {
  id: 'schema-mask',
  draw: drawSchemaMask,
  cues: ['schema-mask-mask', 'schema-mask-parse', 'schema-mask-valid', 'schema-mask-authority'],
};
