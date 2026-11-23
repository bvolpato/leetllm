import { FRESH_LOGITS, LOGITS, PROBS } from '../fixtures.mjs';
import { lossTrace } from '../arithmetic.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteTeacherForcing(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  const seq = ['bug', 'docs', 'today'];
  drawCompleteHead(ctx, api, C, 'Separate vocabulary toy · observed tokens bug docs today');
  if (b === 0) {
    seq.forEach((v, i) => drawCompleteBox(ctx, api, C, v, xs[i], 410, 340, 100, colors[i], 42));
    const shift = progress('teacher-shift');
    if (started('teacher-shift')) {
      drawCompleteBox(ctx, api, C, 'docs', 450 + 510 * (1 - shift), 650, 340, 100, C.green, 42);
      drawCompleteBox(ctx, api, C, 'today', 960 + 510 * (1 - shift), 650, 340, 100, C.pink, 42);
      drawCompleteText(ctx, api, C, 'input positions', 240, 420, 25, C.muted, 'right');
      drawCompleteText(ctx, api, C, 'next targets', 240, 660, 25, C.muted, 'right');
    }
    if (started('teacher-observed')) {
      drawCompleteArrow(ctx, api, C, 450, 480, 450, 580, C.green);
      drawCompleteArrow(ctx, api, C, 960, 480, 960, 580, C.pink);
      drawCompleteText(
        ctx,
        api,
        C,
        'prefix bug → docs · prefix bug docs → today',
        960,
        910,
        35,
        C.yellow,
        'center',
      );
    }
  } else if (b === 1) {
    const losses = m.sequence.losses.slice(0, 2),
      total = losses[0] + losses[1];
    ['bug → docs', 'bug docs → today'].forEach((v, i) => {
      const y = 405 + i * 230;
      drawCompleteText(ctx, api, C, v, 230, y + 12, 34, colors[i + 1]);
      drawCompleteText(
        ctx,
        api,
        C,
        '[' + [LOGITS, FRESH_LOGITS][i].join(', ') + ']',
        890,
        y + 12,
        33,
        C.ink,
        'center',
      );
      if (started('teacher-token-losses')) {
        drawCompleteBox(
          ctx,
          api,
          C,
          'p ' + [PROBS[1], lossTrace(FRESH_LOGITS, 2).probabilities[2]][i].toFixed(6),
          1380,
          y,
          420,
          80,
          colors[i + 1],
          30,
        );
        drawCompleteText(
          ctx,
          api,
          C,
          'loss ' + losses[i].toFixed(6),
          1380,
          y + 100,
          32,
          colors[i + 1],
          'center',
        );
      }
    });
    if (started('teacher-loss-mean')) {
      drawCompleteText(
        ctx,
        api,
        C,
        '(' + losses.map((v) => v.toFixed(3)).join(' + ') + ') / 2 = ' + (total / 2).toFixed(6),
        960,
        875,
        37,
        C.cyan,
        'center',
      );
      if (started('teacher-first-contribution')) {
        api.rect(ctx, 350, 935, (1220 * losses[0]) / total, 38, C.green);
        api.rect(
          ctx,
          350 + (1220 * losses[0]) / total,
          935,
          (1220 * losses[1]) / total,
          38,
          C.pink,
        );
        drawCompleteText(
          ctx,
          api,
          C,
          'first position contributes ' + ((100 * losses[0]) / total).toFixed(1) + '%',
          960,
          1010,
          29,
          C.muted,
          'center',
        );
      }
    }
  } else {
    seq.forEach((v, i) => drawCompleteBox(ctx, api, C, v, xs[i], 400, 340, 90, colors[i], 38));
    const twice = started('teacher-double-shift');
    drawCompleteText(
      ctx,
      api,
      C,
      twice ? 'wrong extra shift' : 'already aligned targets',
      960,
      600,
      35,
      twice ? C.pink : C.green,
      'center',
    );
    drawCompleteBox(
      ctx,
      api,
      C,
      twice ? 'today' : 'docs',
      450,
      735,
      340,
      100,
      twice ? C.pink : C.green,
      39,
    );
    if (!twice) drawCompleteBox(ctx, api, C, 'today', 960, 735, 340, 100, C.pink, 39);
    if (started('teacher-mask-roles')) {
      drawCompleteText(
        ctx,
        api,
        C,
        'attention mask: which inputs can be read',
        500,
        935,
        29,
        C.cyan,
        'center',
      );
      drawCompleteText(
        ctx,
        api,
        C,
        'loss mask: which targets contribute',
        1430,
        935,
        29,
        C.yellow,
        'center',
      );
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'An API may shift internally. Inspect its contract before adding a shift.',
    );
  }
}
export function drawTeacherForcingStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteTeacherForcing);
}
export default {
  id: 'teacher-forcing',
  draw: drawTeacherForcingStage,
  cues: [
    'teacher-forcing-0',
    'teacher-shift',
    'teacher-observed',
    'teacher-forcing-1',
    'teacher-token-losses',
    'teacher-loss-mean',
    'teacher-first-contribution',
    'teacher-forcing-2',
    'teacher-double-shift',
    'teacher-mask-roles',
  ],
};
