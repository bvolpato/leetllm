import { drawLine, drawMatrix, drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawBatchIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-batch-identity-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('batch-identity-mechanism', () => {
    if (currentBeat === 0) {
      drawText(ctx, api, 'N=4 paired examples · 8 text encodings', 960, 290, 36, themeColors.blue);
      drawMatrix(
        ctx,
        api,
        Array.from(
          {
            length: 4,
          },
          (_, i) =>
            Array.from(
              {
                length: 4,
              },
              (_, j) => (i === j ? '+' : '−'),
            ),
        ),
        650,
        400,
        160,
        100,
        (i, j) => i === j,
      );
      if (resultComplete('matrix'))
        drawText(ctx, api, '4 × 3 = 12 off-diagonal comparisons', 960, 900, 35, themeColors.cyan);
      if (resultComplete('single')) {
        drawPill(ctx, api, 'N=1: p=1, loss=0', 1530, 610, 550, themeColors.yellow);
      }
      drawNote(
        ctx,
        api,
        'Text encodings can share batched calls · score memory grows quadratically',
      );
    } else if (currentBeat === 1) {
      const gathering = B('gather'),
        gathered = resultComplete('gather'),
        n = gathering ? 8 : 4;
      drawText(
        ctx,
        api,
        gathering
          ? 'Explicit gathering constructs a shared pool'
          : 'Separate denominators survive gradient accumulation',
        960,
        290,
        34,
        themeColors.yellow,
      );
      if (!gathering) {
        for (let k = 0; k < 2; k++)
          drawMatrix(
            ctx,
            api,
            Array.from(
              {
                length: 4,
              },
              (_, i) =>
                Array.from(
                  {
                    length: 4,
                  },
                  (_, j) => (i === j ? '+' : '−'),
                ),
            ),
            300 + k * 850,
            420,
            140,
            90,
            (i, j) => i === j,
          );
        drawText(ctx, api, '12 + 12 off-diagonal terms', 960, 930, 35, themeColors.cyan);
      } else {
        const rows = Math.min(8, Math.ceil(8 * cueProgress('gather')));
        drawMatrix(
          ctx,
          api,
          Array.from(
            {
              length: rows,
            },
            (_, i) =>
              Array.from(
                {
                  length: n,
                },
                (_, j) => (i === j ? '+' : '−'),
              ),
          ),
          620,
          360,
          85,
          65,
          (i, j) => i === j,
        );
        drawText(
          ctx,
          api,
          gathered
            ? 'Explicit shared 8-pair pool: 8 × 7 = 56'
            : 'Gathering paired rows: ' + rows + ' / 8',
          960,
          950,
          34,
          gathered ? themeColors.cyan : themeColors.muted,
        );
      }
      drawNote(
        ctx,
        api,
        'Gathering is an explicit contrastive-pool operation,not a consequence of accumulation',
      );
    } else {
      drawText(
        ctx,
        api,
        'Distinct questions · same approved passage',
        960,
        300,
        36,
        themeColors.yellow,
      );
      drawPill(ctx, api, 'Q1: rotate API key', 520, 465, 690, themeColors.blue);
      drawPill(ctx, api, 'Q2: replace API token', 1400, 465, 690, themeColors.cyan);
      drawPill(ctx, api, 'Approved passage P9', 960, 755, 1000, themeColors.green);
      if (resultComplete('duplicate')) {
        drawLine(ctx, api, 520, 515, 960, 700, themeColors.green, 3);
        drawLine(ctx, api, 1400, 515, 960, 700, themeColors.green, 3);
        drawText(
          ctx,
          api,
          'Both off-diagonal copies remain relevant',
          960,
          935,
          34,
          themeColors.pink,
        );
      }
      drawNote(
        ctx,
        api,
        'IDs and verified equivalence groups travel with every gathered candidate',
      );
    }
  });
}
export default {
  id: 'batch-identity',
  draw: drawBatchIdentity,
  cues: [
    'cl-batch-identity-matrix',
    'cl-batch-identity-single',
    'cl-batch-identity-separate',
    'cl-batch-identity-gather',
    'cl-batch-identity-duplicate',
  ],
};
