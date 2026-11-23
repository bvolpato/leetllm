import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawPairedService(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-paired-service-mechanism', () => {
    if (currentBeat === 0) {
      drawConstructionsCenter(
        ctx,
        api,
        'Retain request identity and the complete comparison contract',
        245,
      );
      const fields = [
        'target + quantization',
        'prompts + sampling',
        'hardware topology',
        'offered arrivals',
      ];
      fields.forEach((v, i) =>
        drawConstructionsBox(ctx, api, v, 150 + i * 435, 365, 405, themeColors.blue),
      );
      drawConstructionsBox(ctx, api, 'Same request IDs', 610, 590, 700, themeColors.yellow);
      api.arrow(ctx, 960, 700, 510, 820, themeColors.cyan, 4);
      api.arrow(ctx, 960, 700, 1410, 820, themeColors.cyan, 4);
      drawConstructionsBox(ctx, api, 'Baseline', 190, 850, 640, themeColors.blue);
      drawConstructionsBox(ctx, api, 'Speculation', 1090, 850, 640, themeColors.cyan);
    } else if (currentBeat === 1) {
      drawConstructionsCenter(
        ctx,
        api,
        'Client-visible token deliveries · milliseconds after submission',
        245,
      );
      const xs = [300, 301, 302, 500].map((v) => 250 + ((v - 300) / 200) * 1420);
      drawConstructionsLine(ctx, api, 250, 520, 1670, 520, themeColors.muted, 3);
      xs.forEach((x, i) => {
        api.circle(ctx, x, 520, 12, themeColors.blue);
        drawConstructionsText(
          ctx,
          api,
          String([300, 301, 302, 500][i]),
          i < 3 ? 300 + i * 180 : 1670,
          380,
          29,
          themeColors.blue,
          'center',
        );
        if (i < 3) drawConstructionsLine(ctx, api, x, 495, 300 + i * 180, 415, themeColors.blue, 2);
      });
      if (done(1, 'sd-service-gaps'))
        drawConstructionsCenter(
          ctx,
          api,
          'Observed gaps: 1, 1, 198 ms',
          725,
          themeColors.yellow,
          40,
        );
      if (done(1, 'sd-service-average'))
        drawConstructionsCenter(
          ctx,
          api,
          'Mean 66.7 ms · maximum gap 198 ms',
          855,
          themeColors.pink,
          35,
        );
      drawConstructionsCenter(
        ctx,
        api,
        'One bundled network event does not reveal individual token gaps',
        1010,
        themeColors.muted,
      );
    } else {
      drawConstructionsCenter(
        ctx,
        api,
        'Separate supplied 20-second trials · required attainment 95%',
        245,
      );
      const trials = [
        {
          offer: 180,
          qual: 174,
        },
        {
          offer: 220,
          qual: 204,
        },
      ];
      trials.forEach((r, i) => {
        const x = 150 + i * 900;
        drawConstructionsText(
          ctx,
          api,
          'Trial ' + (i ? 'B' : 'A'),
          x + 350,
          360,
          35,
          themeColors.blue,
          'center',
        );
        api.rect(ctx, x, 450, 720, 90, themeColors.panel, themeColors.muted, 4);
        api.rect(ctx, x, 450, (720 * r.qual) / r.offer, 90, themeColors.cyan);
        drawConstructionsText(
          ctx,
          api,
          r.qual + '/' + r.offer + ' = ' + ((100 * r.qual) / r.offer).toFixed(2) + '%',
          x + 360,
          640,
          36,
          themeColors.cyan,
          'center',
        );
        if (done(3, 'sd-service-capacity')) drawConstructionsText(
          ctx,
          api,
          r.offer / 20 + ' offered/s · ' + r.qual / 20 + ' qualified/s',
          x + 360,
          760,
          30,
          themeColors.ink,
          'center',
        );
        if (done(3, 'sd-service-verdict')) drawConstructionsText(
          ctx,
          api,
          r.qual / r.offer >= 0.95 ? 'PASS' : 'HOLD',
          x + 360,
          900,
          39,
          r.qual / r.offer >= 0.95 ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      drawConstructionsCenter(
        ctx,
        api,
        done(3, 'sd-service-verdict')
          ? 'Capacity uses the highest offered rate that met the requirement'
          : 'Which trial met the 95% requirement?',
        1010,
        themeColors.yellow,
        28,
      );
    }
  });
  return;
}
export default {
  id: 'paired-service',
  draw: drawPairedService,
  cues: [
    'sd-paired-service-b0',
    'sd-paired-service-b1',
    'sd-service-gaps',
    'sd-service-average',
    'sd-paired-service-b2',
    'sd-service-verdict',
    'sd-service-capacity',
  ],
};
