import { edgeState } from '../model.mjs';
import {
  drawEdgeEquation,
  drawEdgeMove,
  drawEdgeRectangle,
  drawEdgeRow,
  drawEdgeText,
} from '../defaults.mjs';
export function drawDistillObjective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('distill-objective', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-distill-objective-mechanism', () => {
    const loss = modelState.loss;
    heading(
      currentBeat === 0
        ? 'Separate token example'
        : currentBeat === 1
          ? 'Match corresponding coordinates'
          : 'One weighted contribution per signal',
    );
    if (currentBeat === 0) {
      const soft = progress('kl') > 0;
      drawEdgeText(
        ctx,
        api,
        soft ? 'Teacher and student at T = 2' : 'Student at T = 1   /   observed token 0',
        960,
        350,
        28,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 3; i++) {
        const x = 310 + i * 560;
        const student = soft ? loss.ps[i] : loss.hardShares[i];
        if (soft)
          drawEdgeRectangle(
            ctx,
            api,
            x,
            750 - loss.pt[i] * 380,
            120,
            loss.pt[i] * 380,
            themeColors.blue,
          );
        drawEdgeRectangle(
          ctx,
          api,
          x + 150,
          750 - student * 380,
          120,
          student * 380,
          themeColors.green,
        );
        drawEdgeText(
          ctx,
          api,
          (100 * student).toFixed(1) + '%',
          x + 210,
          727 - student * 380,
          36,
          themeColors.green,
          'center',
        );
        drawEdgeText(ctx, api, `event ${i}`, x + 130, 820, 29, themeColors.ink, 'center');
      }
      drawEdgeEquation(
        ctx,
        api,
        soft
          ? String.raw`\mathrm{KL}(p_t\Vert p_s)=\sum_i p_{t,i}\ln\frac{p_{t,i}}{p_{s,i}}`
          : String.raw`L_{\rm hard}=-\ln p_s(y;T=1)`,
        960,
        940,
        38,
      );
    } else if (currentBeat === 1) {
      drawEdgeRow(
        ctx,
        api,
        ['hard × (1−α)', 'soft KL × T² × α', 'hidden MSE × β'],
        160,
        390,
        1580,
        115,
        themeColors.yellow,
      );
      const th = [0.4, -0.1, 0.2],
        st = [0.3, 0, 0.1];
      drawEdgeRow(
        ctx,
        api,
        th.map((v) => `teacher ${v}`),
        240,
        600,
        1440,
        85,
        themeColors.blue,
      );
      drawEdgeRow(
        ctx,
        api,
        st.map((v) => `student ${v}`),
        240,
        750,
        1440,
        85,
        themeColors.green,
      );
      for (let i = 0; i < 3; i++)
        drawEdgeMove(
          ctx,
          api,
          {
            x: 476 + i * 480,
            y: 700,
          },
          {
            x: 476 + i * 480,
            y: 735,
          },
          q,
          themeColors.yellow,
        );
      drawEdgeText(
        ctx,
        api,
        'Frozen teacher · aligned prefixes · padding masked · explicit mean denominator',
        960,
        940,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      const terms = [loss.hard, loss.soft, loss.hidden],
        weights = [0.2, 0.8, 0.2];
      drawEdgeRow(
        ctx,
        api,
        ['hard CE', 'T² KL', 'hidden MSE'],
        150,
        360,
        1600,
        80,
        themeColors.cyan,
      );
      drawEdgeRow(
        ctx,
        api,
        terms.map((v) => (done('terms') ? v.toFixed(4) : 'pending')),
        150,
        480,
        1600,
        80,
        themeColors.blue,
      );
      drawEdgeRow(
        ctx,
        api,
        weights.map((v) => `× ${v}`),
        150,
        590,
        1600,
        80,
        themeColors.yellow,
      );
      let x = 200;
      loss.parts.forEach((v, i) => {
        const w = v * 6300;
        drawEdgeRectangle(
          ctx,
          api,
          x,
          760,
          w * progress(['hard-part', 'soft-part', 'hidden-part'][i]),
          115,
          [themeColors.blue, themeColors.green, themeColors.yellow][i],
        );
        x += w;
      });
      if (done('total'))
        drawEdgeText(
          ctx,
          api,
          `Full-precision total ${loss.total.toFixed(4)}`,
          960,
          950,
          35,
          themeColors.green,
          'center',
        );
    }
    note(
      currentBeat === 0
        ? 'Green: student probabilities' +
            (progress('kl') > 0 ? '   /   Blue: teacher probabilities' : '')
        : currentBeat === 2
          ? 'The sum uses the unrounded contributions.'
          : '',
    );
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'distill-objective',
  draw: drawDistillObjective,
  cues: [
    'edge-distill-objective-op-0',
    'edge-distill-objective-hard',
    'edge-distill-objective-kl',
    'edge-distill-objective-op-1',
    'edge-distill-objective-weights',
    'edge-distill-objective-hidden',
    'edge-distill-objective-op-2',
    'edge-distill-objective-terms',
    'edge-distill-objective-hard-part',
    'edge-distill-objective-soft-part',
    'edge-distill-objective-hidden-part',
    'edge-distill-objective-total',
  ],
};
