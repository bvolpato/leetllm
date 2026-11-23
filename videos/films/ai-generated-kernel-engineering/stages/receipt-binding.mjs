import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawReceiptBinding(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('receipt-binding', state),
    colors = [
      themeColors.blue,
      themeColors.cyan,
      themeColors.pink,
      themeColors.green,
      themeColors.yellow,
    ];
  api.focus.target('receipt-binding-construction', () => {
    const fields = [
      'source S1',
      'artifact K1',
      'dispatch D1',
      'reference R1',
      'policy P1',
      'raw evidence',
    ];
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Which build did the reviewer check?',
        'Release record for kernel K1',
      );
      fields.forEach((name, i) => {
        const x = 280 + (i % 3) * 480,
          y = 430 + Math.floor(i / 3) * 220;
        drawRow(
          ctx,
          api,
          [name],
          x,
          y,
          400,
          i < Math.ceil(progress * 6) ? colors[i % 5] : themeColors.muted,
        );
      });
      drawNote(
        ctx,
        api,
        'Record the GPU, workload, precision and resource use alongside the recovery plan',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Two reports are missing',
        'Release record for kernel K1',
      );
      drawRow(ctx, api, ['device validation', 'NOT RUN'], 270, 430, 1380, themeColors.pink);
      drawRow(
        ctx,
        api,
        ['Numerical report   Missing', 'Sanitizer report   Missing'],
        270,
        620,
        1380,
        themeColors.muted,
      );
      if (at('template', 1))
        drawChapterText(
          ctx,
          api,
          'Awaiting review   ·   Unsigned',
          960,
          850,
          38,
          themeColors.yellow,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Use the hash to retrieve the reviewed bytes and verify the results',
      );
    } else {
      const changed = at('change', 2);
      drawTitle(
        ctx,
        api,
        'A signature covers exact canonical payload bytes',
        'Separate trusted-key approval envelope · supplied protocol illustration',
      );
      drawRow(
        ctx,
        api,
        ['S1', 'K1', changed ? 'D2' : 'D1', 'R1', 'P1'],
        260,
        430,
        1400,
        changed ? themeColors.pink : themeColors.blue,
      );
      drawRow(
        ctx,
        api,
        [changed ? 'payload hash changes' : 'payload hash h1', 'signature h1 / trusted key'],
        260,
        650,
        1400,
        changed ? themeColors.pink : themeColors.green,
      );
      drawChapterText(
        ctx,
        api,
        changed ? 'D2 requires fresh review' : 'verify envelope against trusted registry',
        960,
        855,
        35,
        changed ? themeColors.pink : themeColors.green,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Hardware,software,policy and specialization changes require revalidation before speed ranking',
      );
    }
  });
}
export default {
  id: 'receipt-binding',
  draw: drawReceiptBinding,
  cues: [
    'kg-receipt-binding-voice-0',
    'kg-receipt-binding-voice-1',
    'kg-receipt-binding-template',
    'kg-receipt-binding-voice-2',
    'kg-receipt-binding-change',
  ],
};
