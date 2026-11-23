import { drawHeading, drawTag, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';
export function drawAuditReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const cue = voice(scene, state);
  api.focus.target('sr-audit-receipt-mechanism', () => {
    const q = cue('sr-audit-receipt-fields').progress,
      fields = [
        'tenant / principal',
        'source / policy revision',
        'returned IDs + reason',
        'filter fingerprint',
        'rewrite / cache context',
        'redaction events',
      ];
    drawHeading(ctx, api, 'Restricted decision receipt · no protected passage body');
    fields.forEach((n, i) => {
      if (q * 6 >= i + 1 || currentBeat > 0)
        drawTag(
          ctx,
          api,
          'field ' + (i + 1),
          n,
          170 + (i % 3) * 550,
          350 + Math.floor(i / 3) * 145,
          470,
          themeColors.blue,
        );
    });
    if (cue('sr-audit-receipt-1').phase === 'after')
      drawTag(ctx, api, 'req-123', 'Allow', 170, 700, 690, themeColors.green);
    if (cue('sr-audit-receipt-two').phase === 'after')
      drawTag(ctx, api, 'req-124', 'Block', 1050, 700, 690, themeColors.pink);
    if (currentBeat === 1 && cue('sr-audit-receipt-alert').phase === 'after')
      drawText(
        ctx,
        api,
        'Simulated alert   /   req-124',
        1395,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2) {
      drawTag(
        ctx,
        api,
        'Audit durability required',
        'write pending',
        170,
        835,
        690,
        themeColors.yellow,
      );
      if (cue('sr-audit-receipt-delivery').phase === 'after')
        drawTag(
          ctx,
          api,
          'Audit delivery failure',
          'HOLD protected release',
          1050,
          835,
          690,
          themeColors.pink,
        );
    }
  });
}
export default {
  id: 'audit-receipt',
  draw: drawAuditReceipt,
  cues: [
    'sr-audit-receipt-0',
    'sr-audit-receipt-fields',
    'sr-audit-receipt-1',
    'sr-audit-receipt-two',
    'sr-audit-receipt-alert',
    'sr-audit-receipt-2',
    'sr-audit-receipt-delivery',
  ],
};
