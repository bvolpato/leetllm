import { WORDS } from '../fixtures.mjs';
import { positiveTemperature } from '../arithmetic.mjs';
import {
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteTemperatureLimits(
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
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 0
      ? 'Temperature changes concentration, not score ranking'
      : b === 1
        ? 'Subtract the maximum before dividing'
        : 'Teacher and student both soften at the same T',
  );
  if (b === 0) {
    const Tvalue = started('temperature-uniform')
      ? 1 + 99 * progress('temperature-uniform')
      : started('temperature-zero-limit')
        ? 1 - 0.99 * progress('temperature-zero-limit')
        : 1;
    drawCompleteRow(
      ctx,
      api,
      C,
      colors,
      xs,
      positiveTemperature([2, 2, 0], Tvalue),
      430,
      ['max A', 'max B', 'lower'],
      220,
    );
    drawCompleteText(
      ctx,
      api,
      C,
      'T = ' + Tvalue.toFixed(3) + ' · tied maxima remain tied',
      960,
      850,
      35,
      C.cyan,
      'center',
    );
    if (started('temperature-greedy'))
      drawCompleteText(
        ctx,
        api,
        C,
        'T = 0: separate greedy API branch; no softmax division',
        960,
        960,
        32,
        C.yellow,
        'center',
      );
    if (started('temperature-calibration')) {
      drawCompleteBox(ctx, api, C, 'calibration: held-out outcomes', 510, 355, 730, 60, C.cyan, 27);
      drawCompleteBox(ctx, api, C, 'selection: separate policy', 1430, 355, 650, 60, C.yellow, 27);
    }
  } else if (b === 1) {
    drawCompleteText(
      ctx,
      api,
      C,
      'z = [10³⁰⁸, 10³⁰⁸, 10³⁰⁸] · T = 10⁻³⁰⁸',
      960,
      370,
      36,
      C.blue,
      'center',
    );
    drawCompleteText(ctx, api, C, 'divide first', 420, 495, 31, C.pink, 'center');
    drawCompleteText(ctx, api, C, 'shift first', 1390, 495, 31, C.green, 'center');
    if (started('temperature-overflow')) {
      drawCompleteBox(ctx, api, C, '[∞, ∞, ∞]', 420, 600, 550, 90, C.pink, 38);
      drawCompleteText(ctx, api, C, '∞ − ∞ → NaN', 420, 755, 37, C.pink, 'center');
    }
    if (started('temperature-safe')) {
      drawCompleteBox(ctx, api, C, '[0, 0, 0] / T', 1390, 600, 550, 90, C.green, 38);
      drawCompleteText(ctx, api, C, '[⅓, ⅓, ⅓]', 1390, 755, 39, C.green, 'center');
    }
    if (started('temperature-all-masked')) {
      drawCompleteText(
        ctx,
        api,
        C,
        '[finite, −∞] → valid candidates',
        500,
        930,
        30,
        C.cyan,
        'center',
      );
      drawCompleteText(ctx, api, C, '[−∞, −∞] → no distribution', 1430, 930, 30, C.pink, 'center');
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'NaN and +∞ require validation; a finite maximum is a precondition for this stable path.',
    );
  } else {
    const t = 1 + 9 * progress('distill-both'),
      teacher = positiveTemperature([3, 1, 0], t),
      student = positiveTemperature([2, 0.5, 0], t);
    drawCompleteText(ctx, api, C, 'teacher logits [3, 1, 0]', 500, 375, 30, C.blue, 'center');
    drawCompleteText(ctx, api, C, 'student logits [2, .5, 0]', 1400, 375, 30, C.green, 'center');
    teacher.forEach((v, i) => {
      const y = 475 + i * 100;
      drawCompleteText(ctx, api, C, WORDS[i], 220, y + 12, 28, colors[i]);
      api.rect(ctx, 400, y - 25, v * 700, 42, C.blue);
      api.rect(ctx, 1190, y - 25, student[i] * 700, 42, C.green);
    });
    drawCompleteText(ctx, api, C, 'T = ' + t.toFixed(2), 960, 820, 36, C.yellow, 'center');
    if (started('distill-gradient'))
      drawCompleteEquation(ctx, api, C, '\u2207_z L=(p_T-y_T)/T', 960, 910, 40, C.cyan);
    if (started('distill-scale'))
      drawCompleteText(
        ctx,
        api,
        C,
        'high-T teacher/student difference also shrinks · soft objective uses T²',
        960,
        990,
        29,
        C.yellow,
        'center',
      );
  }
}
export function drawTemperatureLimitsStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteTemperatureLimits);
}
export default {
  id: 'temperature-limits',
  draw: drawTemperatureLimitsStage,
  cues: [
    'temperature-limits-0',
    'temperature-zero-limit',
    'temperature-uniform',
    'temperature-greedy',
    'temperature-calibration',
    'temperature-limits-1',
    'temperature-overflow',
    'temperature-safe',
    'temperature-all-masked',
    'temperature-limits-2',
    'distill-both',
    'distill-gradient',
    'distill-scale',
  ],
};
