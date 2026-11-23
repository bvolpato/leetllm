import { constructedFrame } from '../construction.mjs';
import { jensenConstruction } from '../model.mjs';
import {
  drawConstructedArrow,
  drawConstructedBox,
  drawConstructedCurve,
  drawConstructedEquation,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawJensenConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    colors = [themeColors.blue, themeColors.pink];
  api.focus.target('jensen-construction-operation', () => {
    const v = jensenConstruction(currentBeat === 2 ? f.progress('jensen-posterior') : 0);
    if (currentBeat === 0) {
      drawConstructedHead(ctx, api, '50 ms request     Means 30 and 90 ms     Standard deviations 20 ms');
      v.joint.forEach((value, i) => {
        const x = i ? 1410 : 510;
        drawConstructedText(
          ctx,
          api,
          i ? 'slow joint density' : 'fast joint density',
          x,
          365,
          32,
          colors[i],
          'center',
        );
        drawConstructedBox(ctx, api, value.toFixed(8), x, 455, 550, 90, colors[i], 36);
        drawConstructedText(
          ctx,
          api,
          'trial q = ' + v.q[i].toFixed(3),
          x,
          590,
          32,
          themeColors.cyan,
          'center',
        );
        if (f.started('jensen-divide')) {
          drawConstructedArrow(ctx, api, x, 640, x, 715, colors[i]);
          drawConstructedBox(
            ctx,
            api,
            'joint / q = ' + v.ratios[i].toFixed(8),
            x,
            805,
            700,
            90,
            colors[i],
            32,
          );
        }
      });
      if (f.started('jensen-cancel'))
        drawConstructedText(
          ctx,
          api,
          'q-weighted mean = ' + v.total.toFixed(8) + ' per ms · original marginal',
          960,
          960,
          34,
          themeColors.yellow,
          'center',
        );
    } else {
      const tight = f.completed('jensen-posterior', 2),
        boundReady = f.completed('em-jensen-bound-result', 1),
        evidenceReady = f.completed('em-jensen-evidence-result', 1),
        gapReady = boundReady && evidenceReady && f.completed('jensen-gap', 1);
      drawConstructedHead(
        ctx,
        api,
        currentBeat === 1
          ? 'Read both averages at the same horizontal position'
          : tight
            ? 'Posterior q makes the two joint-over-q ratios coincide'
            : 'Move the trial q toward the posterior',
      );
      const p = drawConstructedPlot(
        ctx,
        api,
        220,
        370,
        1060,
        470,
        [0.001, 0.014],
        [-7, -4.2],
        'joint density / q (per ms)',
        'natural log',
        [0.002, 0.006, 0.01, 0.014],
        [-7, -6, -5],
      );
      drawConstructedCurve(ctx, api, p, Math.log, 0.001, 0.014, themeColors.muted, 4);
      const points = v.ratios.map((x, i) => p.point(x, Math.log(x)));
      drawConstructedLine(
        ctx,
        api,
        points[0].x,
        points[0].y,
        points[1].x,
        points[1].y,
        themeColors.yellow,
        4,
      );
      points.forEach((q, i) => api.circle(ctx, q.x, q.y, 12, colors[i]));
      const lower = p.point(v.total, v.bound),
        upper = p.point(v.total, v.logEvidence);
      if (gapReady)
        drawConstructedLine(ctx, api, lower.x, lower.y, upper.x, upper.y, themeColors.cyan, 4);
      if (evidenceReady) api.circle(ctx, upper.x, upper.y, 14, themeColors.green);
      if (boundReady) api.circle(ctx, lower.x, lower.y, 8, themeColors.yellow);
      drawConstructedText(ctx, api, 'Average, then log', 1550, 420, 32, themeColors.green, 'center');
      drawConstructedText(
        ctx,
        api,
        evidenceReady ? v.logEvidence.toFixed(6) : '?',
        1550,
        485,
        38,
        evidenceReady ? themeColors.green : themeColors.muted,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        'Log, then average',
        1550,
        615,
        30,
        themeColors.yellow,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        boundReady ? v.bound.toFixed(6) : '?',
        1550,
        680,
        38,
        boundReady ? themeColors.yellow : themeColors.muted,
        'center',
      );
      if (gapReady)
        drawConstructedText(
          ctx,
          api,
          'Gap   ' + Math.max(0, v.gap).toFixed(6) + ' nats',
          1550,
          820,
          36,
          themeColors.cyan,
          'center',
        );
      if (currentBeat === 2)
        drawConstructedText(
          ctx,
          api,
          (tight ? 'posterior q = [' : 'current trial q = [') +
            v.q.map((x) => x.toFixed(4)).join(', ') +
            ']',
          960,
          965,
          34,
          themeColors.cyan,
          'center',
        );
      else
        drawConstructedEquation(
          ctx,
          api,
          String.raw`\log E_q[p/q]\geq E_q[\log(p/q)]`,
          960,
          965,
          39,
          themeColors.ink,
        );
    }
  });
}
export default {
  id: 'jensen-construction',
  draw: drawJensenConstruction,
  cues: [
    'jensen-construction-0',
    'jensen-divide',
    'jensen-cancel',
    'jensen-construction-1',
    'jensen-gap',
    'em-jensen-bound-result',
    'em-jensen-evidence-result',
    'jensen-construction-2',
    'jensen-posterior',
  ],
};
