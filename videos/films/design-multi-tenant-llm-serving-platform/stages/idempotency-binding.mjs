import { mtEvent } from '../construction.mjs';
import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLedger,
  drawConstructionLine,
  drawConstructionPacket,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawIdempotencyBinding(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('idempotency-binding', state),
    currentBeat = modelState.b,
    ev = (beat, sentence) => mtEvent('idempotency-binding', state, beat, sentence);
  withConstructionFocus(ctx, api, 'idempotency-binding', () => {
    if (currentBeat < 2) {
      drawConstructionBox(
        ctx,
        api,
        'Tenant A / key r1\nResolved fingerprint F1',
        130,
        335,
        710,
        150,
        themeColors.blue,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        'Existing reservation r1 / F1',
        1070,
        335,
        710,
        150,
        themeColors.cyan,
        31,
      );
      if (currentBeat === 0) {
        drawConstructionPacket(
          ctx,
          api,
          'idempotency-binding',
          'same key + F1',
          160,
          570,
          1090,
          570,
          ev(0),
          themeColors.blue,
          300,
          80,
        );
        if (modelState.sameAccepted)
          drawConstructionCenter(
            ctx,
            api,
            'Return existing record · no new reservation',
            960,
            760,
            34,
            themeColors.green,
          );
        if (modelState.conflict) {
          drawConstructionBox(ctx, api, 'same key + F2', 220, 860, 550, 90, themeColors.pink, 31);
          drawConstructionLine(ctx, api, 930, 825, 930, 985, themeColors.pink, 6);
          drawConstructionCenter(
            ctx,
            api,
            'CONFLICT · F1 and balance retained',
            1400,
            915,
            30,
            themeColors.pink,
          );
        }
      } else {
        drawConstructionBox(
          ctx,
          api,
          'msg-7 → A / r1 / attempt-1',
          150,
          575,
          690,
          95,
          themeColors.cyan,
          29,
        );
        drawConstructionBox(
          ctx,
          api,
          'msg-8 → same logical usage',
          1080,
          575,
          690,
          95,
          themeColors.cyan,
          29,
        );
        if (modelState.completionDuplicate)
          drawConstructionCenter(
            ctx,
            api,
            'Two deliveries → one settlement',
            960,
            785,
            35,
            themeColors.green,
          );
        if (modelState.completionReplay)
          drawConstructionCenter(
            ctx,
            api,
            'Identical completion → no new effect',
            960,
            850,
            30,
            themeColors.green,
          );
        if (modelState.completionConflict)
          drawConstructionCenter(
            ctx,
            api,
            'Different output count → conflict, preserve first receipt',
            960,
            915,
            30,
            themeColors.pink,
          );
      }
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Separate fixed-period example: allowance 1,200',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        'Input 200 + output cap 500',
        370,
        345,
        1180,
        100,
        themeColors.cyan,
        33,
      );
      drawConstructionLedger(
        ctx,
        api,
        'idempotency-binding',
        modelState.balance,
        modelState.total,
        140,
        610,
        1640,
      );
      if (modelState.settled)
        drawConstructionCenter(
          ctx,
          api,
          'Trusted output 150 → actual 350 · unused 350 returned',
          960,
          900,
          31,
          themeColors.green,
        );
      if (modelState.replayed)
        drawConstructionCenter(
          ctx,
          api,
          'Same completion replay → 850 remains available',
          960,
          975,
          30,
          themeColors.yellow,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Request fingerprint and execution-attempt identity survive changing transport message IDs',
    );
  });
}
export default {
  id: 'idempotency-binding',
  draw: drawIdempotencyBinding,
  cues: [
    'mt-idempotency-binding-b0',
    'mt-idempotency-binding-s0-2',
    'mt-idempotency-binding-s0-3',
    'mt-idempotency-binding-b1',
    'mt-idempotency-binding-s1-2',
    'mt-idempotency-binding-s1-3',
    'mt-idempotency-binding-s1-4',
    'mt-idempotency-binding-b2',
    'mt-idempotency-binding-s2-0',
    'mt-idempotency-binding-s2-1',
    'mt-idempotency-binding-s2-2',
    'mt-idempotency-binding-s2-3',
    'mt-idempotency-binding-s2-4',
  ],
};
