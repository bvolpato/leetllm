import { gammaDensity, mixtureDensity } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { fitted, totalVarianceMle } from '../model.mjs';
import { constructedFrame } from '../construction.mjs';
import { drawJars } from '../jars.mjs';

const total = observations.reduce((sum, value) => sum + value, 0);
const mean = total / observations.length;
const halfWidth = 10;
const inside = observations.filter((value) => Math.abs(value - mean) <= halfWidth).length;

export function drawIntro(ctx, scene, state, api) {
  const f = constructedFrame(state);
  if (f.beat < 2) return drawJars(ctx, state, api);

  const { C } = api;
  const x = (value) => 180 + (value - 10) * 15.6;
  const base = 712;
  const meanKnown = f.completed('intro-mean-result', 2);
  const window = f.progress('intro-window', 2);
  const countKnown = f.completed('intro-count', 3);
  const pooled = f.progress('intro-pooled', 3);
  const mixture = f.progress('intro-mixture', 3);
  const label = (s, px, py, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, px, py, size, color, align);

  api.focus.target('latency-sample', () => {
    if (window > 0) {
      const edge = halfWidth * window;
      api.rect(ctx, x(mean - edge), 320, x(mean + edge) - x(mean - edge), base - 320, C.panel, undefined, 0);
    }
    api.line(ctx, x(10), base, x(110), base, C.muted, 3);
    for (const tick of [10, 30, 50, 60, 70, 90, 110]) {
      api.line(ctx, x(tick), base, x(tick), base + 14, C.muted, 2);
      label(String(tick), x(tick), base + 52, 29, C.muted);
    }
    label('Request latency (ms)', x(mean), base + 108, 31);
    if (meanKnown) {
      api.line(ctx, x(mean), 296, x(mean), base, C.yellow, 3);
      api.math(ctx, String.raw`\mathrm{Mean}=${total}/${observations.length}=${mean}\,\mathrm{ms}`,
        x(mean), 270, 38, C.yellow, 'center');
    }
    observations.forEach((v, i) => {
      const startY = 360 + (i % 3) * 100;
      const y = api.lerp(startY, base - 13, pooled);
      api.line(ctx, x(v), y, x(v), base, C.muted, 2);
      api.circle(ctx, x(v), y, 9, C.ink);
      if (pooled === 0) label(v + ' ms', x(v) + 20, y + 10, 30, C.ink, 'left');
    });
    const curve = (density, progress, color) => {
      if (progress <= 0) return;
      const points = Array.from({ length: 401 }, (_, i) => {
        const v = 10 + 100 * progress * i / 400;
        return { x: x(v), y: base - 3050 * density(v) };
      });
      api.path(ctx, points, { color, width: 5 });
    };
    curve((v) => gammaDensity(v, mean, totalVarianceMle), pooled, C.cyan);
    curve((v) => mixtureDensity(v, fitted.model), mixture, C.green);
    if (pooled > 0) {
      label('Density per ms', 180, 315, 27, C.muted, 'left');
      for (const tick of [0.05, 0.10]) {
        const y = base - 3050 * tick;
        api.line(ctx, 168, y, 180, y, C.muted, 2);
        label(tick.toFixed(2), 155, y + 9, 23, C.muted, 'right');
      }
    }
  });
  api.focus.target('latency-question', () => {
    if (pooled > 0) {
      api.line(ctx, 465, 924, 555, 924, C.cyan, 5);
      label('One Gaussian', 580, 936, 35, C.cyan, 'left');
      if (mixture > 0) {
        api.line(ctx, 968, 924, 1058, 924, C.green, 5);
        label('Two-component mixture', 1083, 936, 35, C.green, 'left');
      }
    } else if (countKnown) {
      label(inside + ' of ' + observations.length + ' requests in the band', 960, 932, 47, C.yellow);
    } else {
      label(window > 0 ? 'How many requests took 50 to 70 ms?' : 'Six observed requests',
        960, 932, 42, C.ink);
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-jars', 'intro-matches', 'intro-shares', 'intro-mean-result', 'intro-window',
    'intro-count', 'intro-pooled', 'intro-mixture'],
};
