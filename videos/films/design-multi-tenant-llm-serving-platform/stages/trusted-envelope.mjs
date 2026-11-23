import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawTrustedEnvelope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('trusted-envelope', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'trusted-envelope', () => {
    const fields = Math.min(
      modelState.fields.length,
      Math.ceil(modelState.fieldProgress * modelState.fields.length),
    );
    drawConstructionBox(
      ctx,
      api,
      'Authenticated Alice → authorized workspace A',
      300,
      280,
      1320,
      90,
      themeColors.blue,
      32,
    );
    modelState.fields.forEach(([key, value], i) =>
      drawConstructionBox(
        ctx,
        api,
        key + '\n' + (i < fields ? value : 'pending'),
        180 + (i % 3) * 575,
        430 + Math.floor(i / 3) * 180,
        535,
        140,
        i < fields ? themeColors.blue : themeColors.muted,
        27,
      ),
    );
    if (currentBeat === 1) {
      drawConstructionBox(
        ctx,
        api,
        'Untrusted JSON tenant: B',
        150,
        865,
        610,
        95,
        themeColors.pink,
        30,
      );
      drawConstructionLine(ctx, api, 875, 835, 875, 995, themeColors.pink, 6);
      drawConstructionArrow(ctx, api, 780, 915, 845, 915, themeColors.pink);
      drawConstructionBox(
        ctx,
        api,
        'Retained trusted context: A / Alice',
        1020,
        865,
        750,
        95,
        themeColors.green,
        29,
      );
      drawConstructionCenter(
        ctx,
        api,
        modelState.denied ? 'No identity overwrite' : 'Issuer · audience · expiry · operation',
        960,
        790,
        28,
        themeColors.yellow,
      );
    } else if (currentBeat === 2)
      drawConstructionBox(
        ctx,
        api,
        modelState.localDenial
          ? 'Alice selecting B → denied before lookup'
          : 'Local resolver begins after credential verification',
        340,
        865,
        1240,
        95,
        modelState.localDenial ? themeColors.pink : themeColors.yellow,
        31,
      );
    drawConstructionFoot(
      ctx,
      api,
      'Envelope integrity, receiver checks and the authorized operation remain separate requirements',
    );
  });
}
export default {
  id: 'trusted-envelope',
  draw: drawTrustedEnvelope,
  cues: [
    'mt-trusted-envelope-b0',
    'mt-trusted-envelope-s0-0',
    'mt-trusted-envelope-s0-1',
    'mt-trusted-envelope-b1',
    'mt-trusted-envelope-s1-1',
    'mt-trusted-envelope-s1-3',
    'mt-trusted-envelope-b2',
    'mt-trusted-envelope-s2-1',
  ],
};
