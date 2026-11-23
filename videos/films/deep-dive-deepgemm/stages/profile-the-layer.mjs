import { layerRuns, sentenceCues } from '../fixtures.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawEquation, drawFooter, drawSubtitle, drawText } from '../defaults.mjs';
export function drawProfileTheLayer(ctx, scene, state, api) {
  return api.focus.target('profile-the-layer-construction', () => {
    const { C: themeColors, components: components, teaching: teaching } = api,
      modelState = sampleDeepGemmChapter('profile-the-layer', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      if (currentBeat === 0) {
        drawSubtitle(ctx, api, 'Select the scope before interpreting a profiler report');
        const names = ['JIT', 'host launch', 'transfer', 'kernel', 'stream wait'],
          colors = [
            themeColors.yellow,
            themeColors.blue,
            themeColors.cyan,
            themeColors.pink,
            themeColors.muted,
          ];
        names.forEach((name, i) =>
          drawBox(
            ctx,
            api,
            name,
            145 + i * 335,
            400,
            285,
            110,
            i <= Math.floor(teaching2(0, 0) * 5) ? colors[i] : themeColors.muted,
            30,
          ),
        );
        const p = teaching2(0, 1);
        if (p > 0)
          components.panel({
            x: 1135,
            y: 570,
            width: 320,
            height: 230,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          });
        if (done(0, 1)) {
          drawText(ctx, api, 'Nsight Compute', 1295, 635, 30, themeColors.pink, 'center');
          drawText(ctx, api, 'one selected kernel', 1295, 720, 28, themeColors.pink, 'center');
        }
        drawText(
          ctx,
          api,
          'Nsight Systems · process path and dependencies',
          960,
          340,
          32,
          themeColors.blue,
          'center',
        );
        if (teaching2(0, 2) > 0)
          drawText(
            ctx,
            api,
            'Collection may replay the kernel',
            550,
            850,
            32,
            themeColors.yellow,
            'center',
          );
      } else if (currentBeat === 1) {
        drawSubtitle(ctx, api, 'Toy roofline · bandwidth 1 TB/s · compute ceiling 80 TFLOP/s');
        const plot = teaching.axes({
          x: 300,
          y: 360,
          width: 1100,
          height: 420,
          xDomain: [0, 160],
          yDomain: [0, 100],
          xTicks: [0, 40, 80, 120, 160],
          yTicks: [0, 20, 40, 60, 80, 100],
          xLabel: 'operations per byte',
          yLabel: 'TFLOP/s',
          fontSize: 27,
        });
        const maxI = 160 * teaching2(1, 0),
          points = Array.from(
            {
              length: 81,
            },
            (_, i) => {
              const intensity = (maxI * i) / 80;
              return plot.point(intensity, Math.min(80, intensity));
            },
          );
        api.path(ctx, points, {
          color: themeColors.cyan,
          width: 5,
        });
        const roof0 = plot.point(0, 80),
          roof1 = plot.point(160, 80);
        api.line(ctx, roof0.x, roof0.y, roof1.x, roof1.y, themeColors.muted, 2);
        if (done(1, 0)) drawEquation(ctx, api, 'P\\le\\min(P_{compute},B\\,I)', 960, 965, 46);
      } else {
        const wider = currentBeat === 2 ? teaching2(2, 2) : 1;
        const showKernel = currentBeat > 2 || teaching2(2, 1) > 0;
        const answered = currentBeat === 3 && done(3, 0);
        const x = (t) => 365 + 9 * t;
        api.focus.target('time-comparison', () => {
          drawText(
            ctx,
            api,
            wider === 0 ? 'Start at kernel entry' : 'Start before preparation',
            130,
            261,
            39,
          );
          drawText(
            ctx,
            api,
            'Illustrative elapsed time (µs)',
            1755,
            262,
            29,
            themeColors.muted,
            'right',
          );
          for (let t = 0; t <= 140; t += 20) {
            api.line(ctx, x(t), 348, x(t), 366, themeColors.muted, 2);
            drawText(ctx, api, t, x(t), 332, 30, themeColors.muted, 'center');
          }
          api.line(ctx, x(0), 359, x(140), 359, themeColors.muted, 2);
          layerRuns.forEach((run, i) => {
            const y = 439 + i * 244;
            const color = i === 0 ? themeColors.blue : themeColors.cyan;
            drawText(ctx, api, run.name, 130, y + 64, 37);
            api.rect(ctx, x(0), y, 9 * 140, 103, themeColors.panel, undefined, 0);
            if (wider > 0)
              api.rect(ctx, x(0), y, 9 * run.prep * wider, 103, themeColors.yellow, undefined, 0);
            if (showKernel) {
              api.rect(ctx, x(run.prep * wider), y, 9 * run.kernel, 103, color, undefined, 0);
              drawText(
                ctx,
                api,
                run.kernel + ' kernel',
                x(run.prep * wider + run.kernel / 2),
                y + 67,
                38,
                themeColors.bg,
                'center',
              );
            }
            if (wider >= 1)
              drawText(
                ctx,
                api,
                run.prep + ' prep',
                x(run.prep / 2),
                y + 64,
                29,
                themeColors.bg,
                'center',
              );
            if (answered) {
              const total = run.prep + run.kernel;
              drawText(ctx, api, total + ' µs', x(total), y + 162, 39, color, 'center');
            }
          });
          const verdict = answered
            ? 'The candidate saves 30 µs in the kernel and adds 40 µs in preparation'
            : wider === 1
              ? 'Which layer finishes first?'
              : 'Same inputs and matching outputs';
          drawText(ctx, api, verdict, 960, 966, 38, themeColors.ink, 'center');
        });
      }
      if (currentBeat < 2)
        drawFooter(ctx, api, 'Use synchronized, unprofiled time for the benchmark');
    }
  });
}
export default {
  id: 'profile-the-layer',
  draw: drawProfileTheLayer,
  cues: sentenceCues('profile-the-layer'),
};
