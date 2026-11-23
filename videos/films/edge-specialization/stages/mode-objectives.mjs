import { edgeState } from '../model.mjs';
import {
  drawEdgeEquation,
  drawEdgeMove,
  drawEdgeRectangle,
  drawEdgeRow,
  drawEdgeText,
} from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawModeObjectives(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('mode-objectives', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-mode-objectives-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Temperature preserves rank while changing odds'
        : currentBeat === 1
          ? 'Forward and reverse KL weight different distributions'
          : 'Evaluate distillation against a held-out hard-label baseline',
    );
    if (currentBeat === 0) {
      const temp = 1 + 2 * q,
        p = stableSoftmax([Math.log(9), 0], temp);
      ['major mode', 'alternative'].forEach((v, i) => {
        const x = 370 + i * 700;
        drawEdgeRectangle(
          ctx,
          api,
          x,
          850 - p[i] * 430,
          280,
          p[i] * 430,
          [themeColors.blue, themeColors.green][i],
        );
        drawEdgeText(
          ctx,
          api,
          `${v} ${p[i].toFixed(3)}`,
          x + 140,
          920,
          29,
          themeColors.ink,
          'center',
        );
      });
      drawEdgeEquation(
        ctx,
        api,
        String.raw`\frac{p_1}{p_2}=\exp\!\left(\frac{z_1-z_2}{T}\right)`,
        960,
        360,
        40,
      );
      drawEdgeText(
        ctx,
        api,
        `Illustrative two-mode teacher · T ${temp.toFixed(2)}`,
        960,
        990,
        28,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const teacher = [0.9, 0.1],
        student = [0.6, 0.4];
      drawEdgeRow(ctx, api, ['mode A', 'mode B'], 400, 360, 1100, 85, themeColors.cyan);
      drawEdgeRow(
        ctx,
        api,
        teacher.map((x) => `teacher p = ${x}`),
        400,
        480,
        1100,
        85,
        themeColors.blue,
      );
      drawEdgeRow(
        ctx,
        api,
        student.map((x) => `student q = ${x}`),
        400,
        600,
        1100,
        85,
        themeColors.green,
      );
      drawEdgeEquation(
        ctx,
        api,
        done('reverse') ? String.raw`\sum_i q_i\ln(q_i/p_i)` : String.raw`\sum_i p_i\ln(p_i/q_i)`,
        960,
        795,
        43,
      );
      if (done('method'))
        drawEdgeRow(
          ctx,
          api,
          ['on-policy sampling', 'variance reduction', 'teacher mixing', 'length normalization'],
          150,
          900,
          1600,
          75,
          themeColors.yellow,
        );
    } else {
      const rows = [
        ['hard labels', 'task evaluation'],
        ['Llama-2 7B teacher', 'more training time'],
        ['distilled student', 'comparable / inferior in tested study'],
      ];
      rows.forEach((r, i) =>
        drawEdgeRow(
          ctx,
          api,
          r,
          200,
          380 + i * 170,
          1500,
          110,
          i === 2 && done('outcome') ? themeColors.pink : themeColors.blue,
        ),
      );
      drawEdgeMove(
        ctx,
        api,
        {
          x: 450,
          y: 955,
        },
        {
          x: 1450,
          y: 955,
        },
        q,
        themeColors.yellow,
      );
    }
    note('Mode mass is an explicitly supplied toy; MobileLLM result is a dated paper observation');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'mode-objectives',
  draw: drawModeObjectives,
  cues: [
    'edge-mode-objectives-op-0',
    'edge-mode-objectives-odds',
    'edge-mode-objectives-op-1',
    'edge-mode-objectives-reverse',
    'edge-mode-objectives-method',
    'edge-mode-objectives-op-2',
    'edge-mode-objectives-outcome',
  ],
};
