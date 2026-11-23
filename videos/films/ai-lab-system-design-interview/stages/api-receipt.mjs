import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header, receipt } from '../defaults.mjs';
export function drawApiReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('api-receipt', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-api-receipt-mechanism', () => {
    header(ctx, api, 'POST /v1/responses → request R-105');
    const fields = [
      ['organization', 'O2'],
      ['workspace', 'W4'],
      ['entitlement', 'E3'],
      ['route policy', 'P7'],
      ['quota bucket', 'Q8'],
      ['cause', currentBeat === 2 ? 'shared capacity' : 'pending'],
    ];
    const count =
      currentBeat === 0
        ? Math.min(3, Math.floor(progress * 4))
        : currentBeat === 1
          ? 3 + Math.min(3, Math.floor(progress * 4))
          : 6;
    receipt(ctx, api, fields.slice(0, count), 180, 420, 640);
    chapterCard(ctx, api, 'Authorized support lookup', 1040, 400, 700, themeColors.cyan);
    chapterCard(ctx, api, 'GET /v1/requests/R-105', 1040, 515, 700, themeColors.blue);
    if (currentBeat === 2) {
      chapterCard(
        ctx,
        api,
        progress > 0.35 ? '503 · shared capacity' : 'Eligible caller · quota available',
        1040,
        680,
        700,
        themeColors.yellow,
      );
      chapterCard(
        ctx,
        api,
        progress > 0.7 ? 'Fallback requires policy + budget' : 'Provider cause retained internally',
        1040,
        800,
        700,
        themeColors.pink,
      );
    } else chapterText(ctx, api, 'Raw key: redacted', 1390, 755, 32, themeColors.muted, 'center');
    footer(
      ctx,
      api,
      'One request identity joins the response with its restricted decision receipt',
    );
  });
}
export default {
  id: 'api-receipt',
  draw: drawApiReceipt,
  cues: [
    'sd-api-receipt-0-operation',
    'sd-api-receipt-0-result',
    'sd-api-receipt-1-operation',
    'sd-api-receipt-1-result',
    'sd-api-receipt-2-operation',
    'sd-api-receipt-2-result',
  ],
};
