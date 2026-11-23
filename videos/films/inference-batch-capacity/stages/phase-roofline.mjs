import { capacityEvent } from '../construction.mjs';
import {
  drawArrow,
  drawCapacityCard,
  drawCells,
  drawCenteredText,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawPhaseRoofline(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('phase-roofline-mechanism', () => {
    if (currentBeat === 0) {
      drawCapacityCard(ctx, api, 'One weight tensor W', 755, 380, 420, 130, themeColors.yellow, 35);
      const pre = ev('prefill', 0),
        dec = ev('decode', 0);
      for (let i = 0; i < 4; i++) {
        drawCells(
          ctx,
          api,
          Array.from(
            {
              length: 6,
            },
            (_, j) => (j < Math.floor(pre * 6) ? 'p' + j : null),
          ),
          140,
          335 + i * 110,
          76,
          62,
          themeColors.blue,
        );
        if (dec > 0)
          drawCapacityCard(
            ctx,
            api,
            'R' + i + ' : next',
            1330,
            335 + i * 110,
            410,
            62,
            themeColors.green,
            27,
          );
      }
      if (pre > 0) drawArrow(ctx, api, 625, 490, 715, 490, themeColors.blue);
      if (dec > 0) drawArrow(ctx, api, 1215, 490, 1290, 490, themeColors.green);
      if (begun('latency', 0)) {
        const x = 240;
        drawLine(ctx, api, x, 900, 1680, 900, themeColors.muted, 3);
        [0, 500, 720, 940, 1400].forEach((d, i) => {
          drawLine(
            ctx,
            api,
            x + d,
            875,
            x + d,
            925,
            i < 2 ? themeColors.yellow : themeColors.green,
            4,
          );
          drawCenteredText(
            ctx,
            api,
            i === 0 ? 'arrival' : i === 1 ? 'first' : String(i),
            x + d,
            972,
            25,
            i < 2 ? themeColors.yellow : themeColors.green,
          );
        });
        drawCenteredText(ctx, api, 'queue + prompt + delivery', 490, 830, 29, themeColors.yellow);
        drawCenteredText(
          ctx,
          api,
          'later gaps: 220, 220, 460 · mean hides the last gap',
          1250,
          830,
          28,
          themeColors.green,
        );
      }
    } else {
      const p = currentBeat === 1 ? ev('intensity', 1) : 1,
        Batch = Math.max(1, Math.round(32 * p));
      drawCenteredText(
        ctx,
        api,
        'Parameter work 2PB / full weight bytes 2P',
        960,
        290,
        34,
        themeColors.yellow,
      );
      const plot = teaching.axes({
        x: 230,
        y: 430,
        width: 1390,
        height: 360,
        xDomain: [0, 330],
        yDomain: [0, 1100],
        xTicks: [0, 100, 200, 300],
        yTicks: [0, 400, 800],
        xLabel: 'arithmetic intensity · FLOPs / byte',
        yLabel: 'rate ceiling · TFLOP/s',
      });
      if (begun('roof', 1)) {
        teaching.curve({
          plot,
          points: [
            {
              x: 0,
              y: 0,
            },
            {
              x: 989.5 / 3.35,
              y: 989.5,
            },
            {
              x: 330,
              y: 989.5,
            },
          ],
          color: themeColors.cyan,
          width: 5,
        });
      }
      if (currentBeat === 1) {
        drawCenteredText(
          ctx,
          api,
          'B = ' + Batch + ' → intensity ≈ ' + Batch + ' FLOPs/B · parameter terms only',
          960,
          915,
          33,
          themeColors.green,
        );
      } else {
        drawCenteredText(
          ctx,
          api,
          'H100 SXM peak rates · BW 3.35 TB/s · dense ' +
            (done('dense', 2) ? '989.5' : '?') +
            ' TFLOP/s',
          960,
          350,
          29,
          themeColors.muted,
        );
        if (done('ridge', 2)) {
          const pt = plot.point(989.5 / 3.35, 989.5);
          api.circle(ctx, pt.x, pt.y, 9, themeColors.yellow);
          drawCenteredText(
            ctx,
            api,
            'ridge = 989.5 / 3.35 = 295.4 FLOPs/B',
            960,
            905,
            31,
            themeColors.yellow,
          );
        }
        if (done('lower', 2))
          drawCenteredText(
            ctx,
            api,
            'Intensity 1 → 3.35 TFLOP/s · 0.34% of compute ceiling',
            960,
            940,
            30,
            themeColors.cyan,
          );
        if (done('steps', 2))
          drawCenteredText(
            ctx,
            api,
            '16 GB weights / 3.35 TB/s → 209.4 ideal full-read steps/s',
            960,
            990,
            28,
            themeColors.muted,
          );
      }
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Compare the wait for the first token with the gaps that follow'
        : 'The lower ceiling sets the rate at each intensity',
    );
  });
}
export default {
  id: 'phase-roofline',
  draw: drawPhaseRoofline,
  cues: [
    'ic-phase-roofline-prefill',
    'ic-phase-roofline-decode',
    'ic-phase-roofline-latency',
    'ic-phase-roofline-intensity',
    'ic-phase-roofline-roof',
    'ic-phase-roofline-dense',
    'ic-phase-roofline-ridge',
    'ic-phase-roofline-lower',
    'ic-phase-roofline-steps',
  ],
};
