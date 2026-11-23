import { clip, smooth, wilsonInterval } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawWilsonConstruction(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors, teaching: teaching } = api;
        const cue = (name, fallback = q) =>
          auditCue(state, 'ba-wilson-construction-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-wilson-construction-' + name, fallback);
        {
          const counts =
            currentBeat < 2
              ? [[3, 3]]
              : [
                  [3, 3],
                  [49, 50],
                  [990, 1000],
                ];
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'Observed 3/3 · test candidate population rates',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            const ax = teaching.axes({
              x: 250,
              y: 390,
              width: 1370,
              height: 420,
              xDomain: [0, 1],
              yDomain: [0, 8],
              xTicks: [0, 0.25, 0.5, 0.75, 1],
              yTicks: [0, 1.96, 4, 8],
              xLabel: 'candidate population p',
              yLabel: 'score distance',
              fontSize: 25,
            });
            const points = Array.from(
              {
                length: 198,
              },
              (_, i) => {
                const v = 0.05 + (0.94 * i) / 197;
                return {
                  x: v,
                  y: (1 - v) / Math.sqrt((v * (1 - v)) / 3),
                };
              },
            );
            teaching.curve({
              plot: ax,
              points,
              color: themeColors.cyan,
              width: 5,
              progress: cue('candidate'),
            });
            const yy = ax.point(0, 1.96).y;
            drawAuditExpansionLine(ctx, api, 250, yy, 1620, yy, themeColors.yellow, 3);
            drawAuditExpansionText(ctx, api, 'z = 1.96', 1640, yy + 8, 26, themeColors.yellow);
            if (shown('wald', progress > 0.1))
              drawAuditExpansionText(
                ctx,
                api,
                'Wald plug-in: zero width at 3/3',
                960,
                925,
                33,
                themeColors.pink,
                'center',
              );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'Square the score inequality · solve its two roots',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            api.math(
              ctx,
              String.raw`(1+z^2/n)p^2-(2\hat p+z^2/n)p+\hat p^2\leq0`,
              960,
              400,
              43,
              themeColors.yellow,
              'center',
            );
            const interval = wilsonInterval(3, 3),
              ax = teaching.axes({
                x: 260,
                y: 570,
                width: 1360,
                height: 240,
                xDomain: [0, 1],
                yDomain: [-0.25, 1],
                xTicks: [0, 0.25, 0.5, 0.75, 1],
                yTicks: [0],
                xLabel: 'candidate p',
                fontSize: 25,
              });
            const fn = (x) => (1 + 1.96 ** 2 / 3) * x * x - (2 + 1.96 ** 2 / 3) * x + 1;
            teaching.curve({
              plot: ax,
              points: Array.from(
                {
                  length: 201,
                },
                (_, i) => ({
                  x: i / 200,
                  y: fn(i / 200),
                }),
              ),
              color: themeColors.cyan,
              width: 4,
              progress: q,
            });
            if (shown('roots', progress > 0.3)) {
              const a = ax.point(interval.low, 0),
                e = ax.point(interval.high, 0);
              drawAuditExpansionLine(ctx, api, a.x, a.y, e.x, e.y, themeColors.green, 12);
            }
            if (shown('formula', progress > 0.5))
              drawAuditExpansionText(
                ctx,
                api,
                'Accepted p lie between the roots',
                960,
                945,
                34,
                themeColors.green,
                'center',
              );
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Same two-sided 95% procedure · different sample sizes',
              960,
              275,
              34,
              themeColors.ink,
              'center',
            );
            counts.forEach(([k, n], i) => {
              const y = 440 + i * 180,
                interval = wilsonInterval(k, n),
                name = ['bound3', 'bound50', 'bound1000'][i],
                reveal = shown(name, progress > i / 3);
              drawAuditExpansionText(ctx, api, k + '/' + n, 230, y + 12, 34, themeColors.blue);
              drawAuditExpansionLine(ctx, api, 530, y, 1640, y, themeColors.muted, 3);
              if (reveal) {
                const x = 530 + interval.low * 1110,
                  highX = 530 + interval.high * 1110;
                drawAuditExpansionLine(ctx, api, x, y, highX, y, themeColors.green, 12);
                api.circle(ctx, x, y, 10, themeColors.green);
                drawAuditExpansionText(
                  ctx,
                  api,
                  interval.low.toFixed(3),
                  x,
                  y + 65,
                  30,
                  themeColors.green,
                  'center',
                );
              }
            });
            drawAuditExpansionNote(
              ctx,
              api,
              'Repeated-sampling coverage under the stated assumptions · bias and dependence require separate checks.',
            );
          }
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'wilson-construction',
  draw: drawWilsonConstruction,
  cues: [
    'wilson-construction-phase-0',
    'ba-wilson-construction-wald',
    'ba-wilson-construction-candidate',
    'ba-wilson-construction-quadratic',
    'wilson-construction-phase-1',
    'ba-wilson-construction-roots',
    'ba-wilson-construction-formula',
    'wilson-construction-phase-2',
    'wilson-three',
    'wilson-fifty',
    'wilson-thousand',
    'wilson-all-pass',
    'ba-wilson-construction-bound3',
    'ba-wilson-construction-bound50',
    'ba-wilson-construction-bound1000',
  ],
};
