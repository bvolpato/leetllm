import { drawFooter, drawHeading, drawRectangle, drawTag, drawText } from '../defaults.mjs';
export function drawMetadataReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-metadata-receipt-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-metadata-receipt-mechanism', () => {
    const fields = [
      ['tenant/source/chunk', 'A / key / chunk-1'],
      ['content revision', '7'],
      ['policy version', '42'],
      ['allowed groups', 'security · platform'],
      ['deleted / validity', 'False / aware interval'],
    ];
    drawHeading(ctx, api, 'Source record → child metadata → backend adapter');
    const q = Q('identity', 0);
    fields.forEach(([n, v], i) => {
      if (q * 5 >= i + 1 || currentBeat > 0)
        drawTag(
          ctx,
          api,
          n,
          currentBeat === 0 ? 'required' : v,
          180,
          345 + i * 115,
          650,
          i < 3 ? themeColors.blue : themeColors.yellow,
        );
    });
    if (currentBeat === 1) {
      const s = Q('source', 1);
      drawRectangle(ctx, api, 1050, 340, 690, 365, themeColors.blue);
      drawText(
        ctx,
        api,
        'key · source revision ' + (resultComplete('source', 1) ? '7' : 'pending'),
        1080,
        405,
        30,
        themeColors.blue,
      );
      drawText(
        ctx,
        api,
        'policy ' + (resultComplete('source', 1) ? '42' : 'pending'),
        1080,
        470,
        29,
        themeColors.yellow,
      );
      if (resultComplete('grants', 1))
        drawText(ctx, api, 'security / platform', 1080, 535, 29, themeColors.green);
      if (resultComplete('iso', 1)) {
        drawText(ctx, api, 'ISO timestamp string', 1080, 620, 27, themeColors.pink);
        drawTag(
          ctx,
          api,
          'Required adapter',
          'decode → aware datetime',
          1050,
          760,
          690,
          themeColors.yellow,
        );
      }
    }
    if (currentBeat === 2) {
      const q = Q('validate', 2);
      ['ingest types', 'backend operators', 'runtime role', 'boundary probes'].forEach((v, i) => {
        if (q * 4 >= i + 1)
          drawTag(
            ctx,
            api,
            v,
            'explicit contract',
            1050,
            350 + i * 140,
            690,
            i < 2 ? themeColors.yellow : themeColors.green,
          );
      });
    }
    drawFooter(
      ctx,
      api,
      'Classification and compliance labels grant access only when source policy explicitly makes them grants.',
    );
  });
}
export default {
  id: 'metadata-receipt',
  draw: drawMetadataReceipt,
  cues: [
    'sr-metadata-receipt-0',
    'sr-metadata-receipt-identity',
    'sr-metadata-receipt-1',
    'sr-metadata-receipt-source',
    'sr-metadata-receipt-grants',
    'sr-metadata-receipt-iso',
    'sr-metadata-receipt-2',
    'sr-metadata-receipt-validate',
  ],
};
