import { gammaDensity } from './arithmetic.mjs';
import { drawConstructedCurve, drawConstructedPlot } from './defaults.mjs';

// Both lengths use the slow density at this request as their unit.
// Dividing both weighted densities by prior_fast * density_slow preserves their shares.
export function drawMembership(ctx, api, {
  model, slice, blue, pinkCopies, answer, prompt, previous, wideShare = false,
}) {
  const { C } = api;
  const { x, means, deviation, densities, prior, responsibilities } = model;
  const colors = [C.blue, C.pink];
  const slowPerFast = Math.round((1 - prior) / prior);
  const ratio = densities[0] / densities[1];
  const label = (s, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, px, py, size, color, align);

  const drawDensities = () => {
    densities.forEach((density, i) => {
      const name = i === 0 ? 'Fast   ' : 'Slow   ';
      const product = '× ' + (i === 0 ? prior : 1 - prior).toFixed(2) + ' ≈ ' +
        model.contributions[i].toFixed(5);
      const y = 855 + 52 * i;
      if (wideShare && answer) {
        label(name + density.toFixed(5) + ' ' + product + ' per ms', 155, y, 27, colors[i]);
      } else {
        label(name + density.toFixed(5) + ' per ms', 155, y, 31, colors[i]);
        if (answer) label(product, 530, y, 29, colors[i]);
      }
    });
  };

  api.focus.target('request-slice', () => {
    label('Component density', 155, 254, 37);
    label('Both standard deviations = ' + deviation + ' ms', 155, 308, 29, C.muted);
    const maximum = deviation === 15 ? 0.03 : 0.025;
    const plot = drawConstructedPlot(ctx, api, 170, 410, 675, 292,
      [0, 120], [0, maximum], 'latency (ms)', 'per ms', [0, 30, 60, 90, 120], [0, 0.01, 0.02]);
    means.forEach((mean, i) => {
      drawConstructedCurve(ctx, api, plot, (v) => gammaDensity(v, mean, deviation ** 2),
        0, 120, colors[i], 5);
      const peak = plot.point(mean, gammaDensity(mean, mean, deviation ** 2));
      label(mean + ' ms', peak.x, peak.y - 22, 27, colors[i], 'center');
    });
    const pin = plot.point(x, 0);
    const top = plot.point(x, maximum);
    api.line(ctx, pin.x, pin.y, pin.x, top.y, C.yellow, 3);
    label(x + ' ms', pin.x, top.y - 24, 32, C.yellow, 'center');
    densities.forEach((density, i) => {
      const sample = plot.point(x, density);
      if (slice > 0) api.circle(ctx, sample.x, sample.y, 8 * slice, colors[i]);
    });
    if (slice >= 1 && !wideShare) drawDensities();
  });
  if (slice >= 1 && wideShare) api.focus.target('request-slice', drawDensities);

  api.focus.target('weighted-strips', () => {
    const left = 992;
    const unit = 83;
    label('For every fast draw', left, 254, 37);
    label('Fast prior ' + prior.toFixed(2) + '     Slow prior ' + (1 - prior).toFixed(2),
      left, 310, 29, C.muted);
    label('1 fast', left, 405, 31, C.blue);
    label(slowPerFast + ' slow', left, 590, 31, C.pink);
    // The small end marks remain as a scale while the learner works the case.
    for (let i = 0; i <= 9; i++) {
      const px = left + i * unit;
      api.line(ctx, px, 685, px, 698, C.muted, 2);
    }
    api.line(ctx, left, 688, left + 9 * unit, 688, C.muted, 2);
    label('One division = one slow density at ' + x + ' ms', left, 747, 28, C.muted);
    if (blue > 0) api.rect(ctx, left, 433, ratio * unit * blue, 56, C.blue, undefined, 1);
    if (blue >= 1) label('≈ ' + ratio.toFixed(2) + ' divisions', left, 529, 27, C.blue);
    if (slice >= 1 && pinkCopies === 0) {
      api.rect(ctx, left, 610, unit, 55, C.panel, C.pink, 1);
      label('One slow draw', left + unit + 22, 650, 27, C.pink);
    }
    for (let i = 0; i < Math.ceil(pinkCopies); i++) {
      const width = Math.min(1, pinkCopies - i) * unit;
      api.rect(ctx, left + i * unit, 610, width, 55, C.pink, undefined, 0);
      if (i > 0) api.line(ctx, left + i * unit, 610, left + i * unit, 665, C.panel, 3);
    }
  });

  api.focus.target('request-share', () => {
    const left = wideShare ? 710 : 992;
    const width = wideShare ? 1100 : 748;
    const top = wideShare ? 830 : 855;
    label(answer ? 'Membership of this request' : prompt, left, top - 24, 33, answer ? C.ink : C.yellow);
    if (!wideShare) api.rect(ctx, left, top, width, 69, C.panel, C.muted, 2);
    else if (!answer) api.line(ctx, left, top + 35, left + width, top + 35, C.muted, 2);
    if (answer) {
      const split = width * responsibilities[0];
      api.rect(ctx, left, top, split, 69, C.blue, undefined, 0);
      api.rect(ctx, left + split, top, width - split, 69, C.pink, undefined, 0);
      responsibilities.forEach((part, i) => {
        const center = i === 0 ? left + split / 2 : left + (width + split) / 2;
        if (wideShare) {
          label(i ? 'Slow' : 'Fast', center - 24, top + 47, 32, C.bg, 'right');
          label(part.toFixed(4), center - 5, top + 47, 38, C.bg);
        } else {
          label((i ? 'Slow  ' : 'Fast  ') + part.toFixed(3), center, top + 45, 30, C.bg, 'center');
        }
      });
    }
    if (previous) {
      label('With fast prior ' + previous.prior.toFixed(2) + ', fast membership was ' +
        previous.responsibilities[0].toFixed(wideShare ? 4 : 3) + '.', left, 977, 27, C.muted);
    }
  });
}
