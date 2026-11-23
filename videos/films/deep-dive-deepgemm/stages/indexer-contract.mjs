import { compressedKeySelection } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import {
  drawBox,
  drawEquation,
  drawFooter,
  drawGrid,
  drawLink,
  drawSubtitle,
  drawText,
  fmt,
} from '../defaults.mjs';
export function drawIndexerContract(ctx, scene, state, api) {
  return api.focus.target('indexer-contract-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('indexer-contract', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Dequantize, score each head, clip, weight and add'
          : currentBeat === 1
            ? 'An empty or unwritten span supplies no selectable key'
            : 'A version migration changes the representation too',
      );
      if (currentBeat === 0) {
        const key = drawBox(
            ctx,
            api,
            'Stored key [2, −1] · scale ½',
            150,
            355,
            670,
            95,
            themeColors.blue,
            34,
          ),
          decoded = drawBox(
            ctx,
            api,
            done(0, 1) ? 'Key [1, −½]' : 'Dequantizing key',
            1110,
            355,
            660,
            95,
            themeColors.cyan,
            34,
          );
        if (teaching2(0, 1) > 0)
          drawLink(ctx, api, key, decoded, teaching2(0, 1), themeColors.blue);
        const rows = [
          {
            q: '[1, 0]',
            dot: 1,
            relu: 1,
            w: 0.4,
            color: themeColors.blue,
          },
          {
            q: '[0, 1]',
            dot: -0.5,
            relu: 0,
            w: 0.6,
            color: themeColors.pink,
          },
        ];
        rows.forEach((r, i) => {
          const y = 575 + i * 145;
          drawBox(ctx, api, 'q' + i + ' ' + r.q, 150, y, 330, 95, r.color, 34);
          drawText(
            ctx,
            api,
            done(0, 2) ? `dot ${fmt(r.dot)}` : 'coordinate sum',
            635,
            y + 60,
            31,
            r.color,
            'center',
          );
          drawText(
            ctx,
            api,
            teaching2(0, 3) > 0 ? `ReLU ${r.relu}` : 'ReLU',
            965,
            y + 60,
            31,
            r.color,
            'center',
          );
          drawText(
            ctx,
            api,
            teaching2(0, 3) > 0 ? `× ${r.w}` : 'head weight',
            1250,
            y + 60,
            31,
            themeColors.yellow,
            'center',
          );
          if (done(0, 3))
            drawText(ctx, api, fmt(r.relu * r.w), 1580, y + 60, 38, themeColors.green, 'center');
        });
        if (done(0, 3)) drawEquation(ctx, api, '0.4\u005ccdot1+0.6\u005ccdot0=0.4', 960, 945, 48);
      } else if (currentBeat === 1) {
        const empty = teaching2(1, 4) > 0,
          values = empty ? ['·', '·', '·'] : [-0.4, -0.2, 0];
        drawGrid(ctx, api, [values], 280, 465, 1275, 160, themeColors.muted, 42);
        drawText(
          ctx,
          api,
          empty ? 'Empty valid span [40,40)' : 'Two negative valid scores + invalid zero',
          960,
          360,
          36,
          themeColors.yellow,
          'center',
        );
        const selected = empty ? null : compressedKeySelection(values, 40, 42)[0];
        if (teaching2(1, 2) > 0 && !empty)
          drawText(
            ctx,
            api,
            'Masked selection: token ' + selected.token,
            960,
            785,
            40,
            themeColors.green,
            'center',
          );
        if (empty) drawText(ctx, api, 'No key returned', 960, 785, 49, themeColors.green, 'center');
        drawText(
          ctx,
          api,
          empty
            ? 'No amount of sentinel cleaning creates a valid token'
            : 'Unrestricted maximum would select invalid column 2',
          960,
          905,
          31,
          themeColors.pink,
          'center',
        );
      } else {
        [
          ['SM90', 'non-MX FP8', 'FP32 head weights / logits', themeColors.blue],
          ['SM100', 'MXFP8 / MXFP4 + UE8M0', 'BF16 head weights / logits', themeColors.pink],
        ].forEach(([name, format, out, color], i) => {
          drawBox(ctx, api, name, 170 + i * 850, 360, 740, 90, color, 38);
          drawBox(ctx, api, format, 170 + i * 850, 560, 740, 110, color, 30);
          drawText(ctx, api, out, 540 + i * 850, 790, 30, color, 'center');
        });
        if (teaching2(2, 3) > 0)
          drawText(
            ctx,
            api,
            '16-byte-aligned weight rows · paged metadata changes with the API',
            960,
            920,
            30,
            themeColors.yellow,
            'center',
          );
      }
      drawFooter(ctx, api, 'Keep version, dtype, valid range and source position mapping together');
    }
  });
}
export default {
  id: 'indexer-contract',
  draw: drawIndexerContract,
  cues: [
    'indexer-contract-b0',
    'dg-indexer-contract-0-0',
    'dg-indexer-contract-0-1',
    'dg-indexer-contract-0-2',
    'dg-indexer-contract-0-3',
    'dg-indexer-contract-0-4',
    'dg-indexer-contract-0-5',
    'indexer-contract-b1',
    'dg-indexer-contract-1-0',
    'dg-indexer-contract-1-1',
    'dg-indexer-contract-1-2',
    'dg-indexer-contract-1-3',
    'dg-indexer-contract-1-4',
    'indexer-contract-b2',
    'dg-indexer-contract-2-0',
    'dg-indexer-contract-2-1',
    'dg-indexer-contract-2-2',
    'dg-indexer-contract-2-3',
    'dg-indexer-contract-2-4',
  ],
};
