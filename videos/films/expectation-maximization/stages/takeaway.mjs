import { gammaDensity, mixtureDensity } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { fitted, totalVarianceMle } from '../model.mjs';
import { constructedFrame } from '../construction.mjs';
import { drawConstructedCurve, drawConstructedPlot } from '../defaults.mjs';

const mean = observations.reduce((total, v) => total + v, 0) / observations.length;
const low = mean - 10;
const high = mean + 10;
const pooled = (v) => gammaDensity(v, mean, totalVarianceMle);
const mixture = (v) => mixtureDensity(v, fitted.model);

function bandProbability(density) {
  const slices = 512;
  const step = (high - low) / slices;
  let sum = (density(low) + density(high)) / 2;
  for (let i = 1; i < slices; i++) sum += density(low + i * step);
  return sum * step;
}
const singleMass = bandProbability(pooled);
const mixtureMass = bandProbability(mixture);
const measured = observations.filter((v) => v >= low && v <= high).length;

export function drawTakeaway(ctx, scene, state, api) {
  const { C } = api;
  const f = constructedFrame(state);
  const curves = f.progress('takeaway-curves', 0);
  const singleProgress = f.progress('takeaway-pooled', 1);
  const mixtureProgress = f.progress('takeaway-fit', 2);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);

  api.focus.target('gap-distributions', () => {
    const plot = drawConstructedPlot(ctx, api, 180, 360, 985, 420, [10, 110], [0, 0.14],
      'request latency (ms)', 'density per ms', [10, 30, 50, 70, 90, 110], [0, 0.05, 0.10]);
    const x1 = plot.point(low, 0).x;
    const x2 = plot.point(high, 0).x;
    api.rect(ctx, x1, 360, x2 - x1, 420, C.panel, undefined, 0);
    label(low + '–' + high + ' ms', (x1 + x2) / 2, 324, 31, C.yellow, 'center');
    const fillTo = low + (high - low) * singleProgress;
    if (singleProgress > 0) {
      const vertices = Array.from({length: 65}, (_, i) => {
        const x = low + (fillTo - low) * i / 64;
        return plot.point(x, pooled(x));
      });
      api.path(ctx, [plot.point(low, 0), ...vertices, plot.point(fillTo, 0)],
        {closed: true, fill: C.cyan, color: C.cyan, width: 0});
    }
    if (curves > 0) {
      drawConstructedCurve(ctx, api, plot, pooled, 10, 110, C.cyan, 4, curves);
      drawConstructedCurve(ctx, api, plot, mixture, 10, 110, C.green, 4, curves);
    }
    if (mixtureProgress > 0) {
      drawConstructedCurve(ctx, api, plot, mixture, low, high, C.green, 8, mixtureProgress);
    }
    observations.forEach((v) => {
      const p = plot.point(v, 0);
      api.line(ctx, p.x, p.y - 19, p.x, p.y, C.ink, 4);
    });
  });
  api.focus.target('gap-probabilities', () => {
    label('Observed in the band', 1245, 328, 31, C.muted);
    label(measured + ' of ' + observations.length + ' requests', 1245, 393, 47);
    label('One Gaussian', 1245, 516, 34, C.cyan);
    label(f.completed('takeaway-pooled-mass', 1) ? (100 * singleMass).toFixed(1) + '% of draws' : '?',
      1245, 576, 37, C.cyan);
    label('Two-component fit', 1245, 684, 34, C.green);
    label(f.completed('takeaway-mix-mass', 2) ?
      (mixtureMass < 1e-6 ? '< 1 per million draws' : (mixtureMass * 100).toFixed(2) + '% of draws') : '?',
      1245, 744, 37, C.green);
  });
  label(f.beat === 0 ? 'Which fit puts more requests in the band?' :
    f.beat === 1 ? 'Probability in the band = area under the curve from 50 to 70 ms' :
    'Check the same interval on representative held-out requests.', 960, 978, 35, C.ink, 'center');
}
export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: ['takeaway-band', 'takeaway-curves', 'takeaway-pooled', 'takeaway-pooled-mass', 'takeaway-fit', 'takeaway-mix-mass'],
};
