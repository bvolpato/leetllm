import { CACHE_RUNS, FEEDBACK_IDS } from '../model.mjs';
import { VOCAB } from '../fixtures.mjs';
import { event } from '../arithmetic.mjs';
import {
  drawExtendedArrow,
  drawExtendedMatrix,
  drawExtendedNote,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintApiAlignment(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Keep all four tensor axes with every projection',
      'B=1 · T=4 · d=8 · two heads',
    );
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      Array.from(
        {
          length: 4,
        },
        (_, i) =>
          Array.from(
            {
              length: 8,
            },
            (_, j) => `${i}${j}`,
          ),
      ),
      180,
      420,
      720,
      330,
      C.blue,
      Math.ceil(32 * p),
    );
    for (let h = 0; h < 2; h++) {
      drawExtendedMatrix(
        ctx,
        api,
        C,
        f,
        Array.from(
          {
            length: 4,
          },
          (_, i) =>
            Array.from(
              {
                length: 4,
              },
              (_, j) => `${i}${j + h * 4}`,
            ),
        ),
        1110 + h * 310,
        420,
        280,
        330,
        colors[h],
      );
      drawExtendedText(ctx, api, C, 'head ' + h, 1250 + h * 310, 815, 29, colors[h], 'center');
    }
    drawExtendedText(
      ctx,
      api,
      C,
      known('shape', 0) ? 'Q, K, V: [1, 2, 4, 4]' : 'reshape projected feature coordinates',
      960,
      900,
      33,
      C.yellow,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Authored coordinate IDs show ownership · shape checks do not measure quality',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Invert the boolean convention deliberately',
      'Dense future mask vs PyTorch SDPA allow mask',
    );
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      Array.from(
        {
          length: 4,
        },
        (_, i) =>
          Array.from(
            {
              length: 4,
            },
            (_, j) => (j > i ? 'True' : 'False'),
          ),
      ),
      200,
      425,
      650,
      350,
      C.pink,
    );
    drawExtendedArrow(ctx, api, C, 890, 600, 1010, 600);
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      Array.from(
        {
          length: 4,
        },
        (_, i) =>
          Array.from(
            {
              length: 4,
            },
            (_, j) => (known('allow', 1) ? (j <= i ? 'True' : 'False') : '?'),
          ),
      ),
      1080,
      425,
      650,
      350,
      C.green,
    );
    drawExtendedText(
      ctx,
      api,
      C,
      'dropout probability = 0 for evaluation',
      960,
      875,
      34,
      C.yellow,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'The function’s explicit dropout argument remains active independently of module.eval()',
    );
  } else {
    const { full, upperLeft, aligned } = CACHE_RUNS[1];
    const select = event(state, 2, 'tr-api-alignment-wrong', 0.38, 0.66);
    const repair = event(state, 3, 'tr-api-alignment-repair', 0.38, 0.64);
    const compared = event(state, 3, 'tr-api-alignment-compare', 0.7, 0.9);
    const reveal = event(state, 3, 'tr-api-alignment-result', 0.02, 0.17);
    const cached = repair === 1 ? aligned : upperLeft;
    const labels = FEEDBACK_IDS.map((i) => VOCAB[i]);
    const left = 310,
      top = 392,
      dx = 161,
      dy = 97;
    drawExtendedText(ctx, api, C, 'Keys in the cache', left + 2 * dx, 262, 36, C.ink, 'center');
    labels.forEach((word, j) =>
      drawExtendedText(ctx, api, C, word, left + (j + 0.5) * dx, top - 35, 28, C.blue, 'center'),
    );
    for (let i = 0; i < 4; i++) {
      drawExtendedText(
        ctx,
        api,
        C,
        'row ' + i,
        left - 42,
        top + i * dy + 49,
        30,
        i === 3 ? C.yellow : C.muted,
        'right',
      );
      for (let j = 0; j < 4; j++) {
        const legal = j <= i;
        const x = left + j * dx,
          y = top + i * dy;
        api.rect(ctx, x, y, dx - 10, dy - 14, legal ? C.blue : C.panel, undefined, 5);
        drawExtendedText(
          ctx,
          api,
          C,
          legal ? 'allow' : '×',
          x + (dx - 10) / 2,
          y + 52,
          28,
          legal ? C.panel : C.muted,
          'center',
        );
      }
    }
    if (select > 0) {
      const y = top + 3 * dy * repair - 6;
      const color = repair === 1 ? C.green : repair > 0 ? C.cyan : C.pink;
      api.arrow(ctx, left - 37, y + 46, left - 10, y + 46, color, 4);
      if (repair === 0 || repair === 1)
        api.rect(ctx, left - 7, y, 4 * dx + 4, dy - 2, null, color, 5);
    }
    drawExtendedText(ctx, api, C, 'One query from “result”', 1115, 296, 41, C.yellow);
    drawExtendedText(ctx, api, C, 'Absolute position 3', 1115, 367, 34, C.ink);
    drawExtendedText(ctx, api, C, 'Local tensor row 0', 1115, 427, 34, C.muted);
    if (select === 1 && (repair === 0 || repair === 1)) {
      drawExtendedText(
        ctx,
        api,
        C,
        repair === 1 ? 'key position ≤ 3' : 'Upper-left alignment',
        1115,
        529,
        33,
        repair === 1 ? C.green : C.pink,
      );
      drawExtendedText(
        ctx,
        api,
        C,
        repair === 1 ? '4 keys can contribute' : '1 key can contribute',
        1115,
        607,
        39,
        C.ink,
      );
    }
    if (reveal === 1) {
      drawExtendedText(
        ctx,
        api,
        C,
        'Full-prefix winner     ' + VOCAB[full.choice],
        1115,
        703,
        31,
        C.muted,
      );
      drawExtendedText(
        ctx,
        api,
        C,
        'Cached winner           ' + VOCAB[cached.choice],
        1115,
        759,
        31,
        C.ink,
      );
      const inspecting = repair === 0 || repair === 1;
      drawExtendedText(ctx, api, C, 'First read feature', 170, 851, 32, C.ink);
      drawExtendedText(ctx, api, C, 'full prefix   ' + f(full.A.at(-1)[0]), 530, 851, 32, C.blue);
      drawExtendedText(
        ctx,
        api,
        C,
        'cached   ' + (inspecting ? f(cached.read[0]) : '…'),
        985,
        851,
        32,
        C.yellow,
      );
      api.text(
        ctx,
        'torch.allclose(cached, dense_last, atol=1e-6)',
        170,
        938,
        35,
        C.ink,
        'left',
        'mono',
      );
      const checked = repair === 0 || compared === 1;
      const matches = cached.read.every(
        (v, i) => Math.abs(v - full.A.at(-1)[i]) <= 1e-6 + 1e-5 * Math.abs(full.A.at(-1)[i]),
      );
      drawExtendedText(
        ctx,
        api,
        C,
        checked ? (matches ? 'True' : 'False') : '…',
        1240,
        938,
        44,
        checked && matches ? C.green : C.pink,
      );
    }
  }
}
export function drawApiAlignmentStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintApiAlignment);
}
export default {
  id: 'api-alignment',
  draw: drawApiAlignmentStage,
  cues: [
    'tr-api-alignment-voice-0',
    'tr-api-alignment-shape',
    'tr-api-alignment-voice-1',
    'tr-api-alignment-allow',
    'tr-api-alignment-result',
    'tr-api-alignment-compare',
    'tr-api-alignment-wrong',
    'tr-api-alignment-repair',
  ],
};
