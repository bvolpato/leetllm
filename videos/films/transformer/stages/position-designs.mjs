import { clamp, position, unmaskedRead } from '../arithmetic.mjs';
import { INPUT } from '../model.mjs';
import {
  drawExtendedArrow,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintPositionDesigns(
  ctx,
  scene,
  state,
  api,
  C,
  id,
  s,
  b,
  p,
  f,
  mix,
  known,
  colors,
) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Follow identity through a row permutation',
      'Supplied Q=K=V · input rows and their computed unmasked reads',
    );
    const labels = ['function', 'returns', 'the'],
      a = [0, 1, 2],
      z = [2, 0, 1];
    for (let i = 0; i < 3; i++) {
      const yy = 430 + i * 135;
      drawExtendedText(ctx, api, C, labels[i], 210, yy + 40, 30, colors[i]);
      drawExtendedRow(ctx, api, C, f, INPUT[i], 500, yy, 570, colors[i]);
      const dest = z.indexOf(i),
        y2 = mix(430 + i * 135, 430 + dest * 135, clamp((p - 0.1) / 0.75));
      if (p === 0 || p >= 0.9)
        drawExtendedRow(
          ctx,
          api,
          C,
          f,
          unmaskedRead(INPUT)[i],
          1230,
          p >= 0.9 ? 430 + dest * 135 : 430 + i * 135,
          530,
          colors[i],
        );
      else {
        const xx = 1160 + i * 200;
        api.rect(ctx, xx, y2, 170, 66, C.panel, colors[i], 2, 7);
        drawExtendedText(ctx, api, C, labels[i], xx + 85, y2 + 43, 27, colors[i], 'center');
      }
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      'Each output follows its row · a fixed causal mask changes the comparison',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'A learned position table has a boundary',
      'The next token needs its own declared position row',
    );
    ['position 0', 'position 1', 'position 2', 'position 3'].forEach((v, i) => {
      drawExtendedText(ctx, api, C, v, 220, 430 + i * 105, 29, i === 3 ? C.pink : C.blue);
      drawExtendedRow(
        ctx,
        api,
        C,
        f,
        i === 3 ? ['?', '?', '?', '?'] : position(i),
        600,
        385 + i * 105,
        720,
        i === 3 ? C.pink : C.blue,
      );
    });
    if (known('learned', 1))
      drawExtendedText(ctx, api, C, 'No stored row here', 1580, 742, 29, C.pink, 'center');
    drawExtendedNote(
      ctx,
      api,
      C,
      'A model change can add a row · longer-context quality still needs evaluation',
    );
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Rotate query and key by their positions',
      'Supplied pair starts at [1, 0] · angle = 0.1 × position',
    );
    const shift = known('rope-shift', 2) ? 2 : Math.floor(2 * clamp((p - 0.55) / 0.25));
    const ms = [4 + shift, 1 + shift];
    for (let i = 0; i < 2; i++) {
      const cx = 520 + i * 850,
        cy = 600,
        r = 180,
        angle = ms[i] * 0.1;
      api.circle(ctx, cx, cy, r, C.panel, C.muted, 1.5);
      api.line(ctx, cx - r, cy, cx + r, cy, C.muted, 1);
      drawExtendedArrow(
        ctx,
        api,
        C,
        cx,
        cy,
        cx + r * Math.cos(angle),
        cy - r * Math.sin(angle),
        colors[i],
      );
      drawExtendedText(
        ctx,
        api,
        C,
        (i ? 'key' : 'query') + ' · position ' + ms[i],
        cx,
        390,
        31,
        colors[i],
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        C,
        'angle ' + f(angle, 1) + ' rad',
        cx,
        850,
        29,
        colors[i],
        'center',
      );
    }
    drawExtendedText(
      ctx,
      api,
      C,
      known('rope', 2)
        ? 'relative angle 0.3 · dot = ' + f(Math.cos(0.3))
        : 'relative angle and dot product: ?',
      960,
      915,
      31,
      C.yellow,
      'center',
    );
    drawExtendedNote(ctx, api, C, 'A common position shift preserves this relative dot product');
  }
}
export function drawPositionDesignsStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintPositionDesigns);
}
export default {
  id: 'position-designs',
  draw: drawPositionDesignsStage,
  cues: [
    'tr-position-designs-voice-0',
    'tr-position-designs-voice-1',
    'tr-position-designs-learned',
    'tr-position-designs-voice-2',
    'tr-position-designs-rope',
    'tr-position-designs-rope-shift',
  ],
};
