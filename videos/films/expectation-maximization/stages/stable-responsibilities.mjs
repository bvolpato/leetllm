import { constructedFrame } from '../construction.mjs';
import { firstResponsibilities, firstUpdate } from '../model.mjs';
import { observations } from '../fixtures.mjs';

const scores = [-1000, -1002];
const max = Math.max(...scores);
const raw = scores.map(Math.exp);
const shifted = scores.map((s) => s - max);
const weights = shifted.map(Math.exp);
const sum = weights[0] + weights[1];
const memberships = weights.map((w) => w / sum);

export function drawStableResponsibilities(ctx, scene, state, api) {
  const { C } = api;
  const f = constructedFrame(state);
  const colors = [C.blue, C.pink];
  const label = (s, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, px, py, size, color, align);

  if (f.beat <= 2) {
    const offset = f.progress('stable-shift', 1);
    const exponentiate = f.progress('stable-exponentials', 1);
    const show = f.completed('stable-normalize', 2);
    api.focus.target('score-ruler', () => {
      label('Log weight + log Gaussian density', 165, 261, 36);
      const px = (s) => 260 + 184 * (s - (max - 4));
      const y = 517;
      api.line(ctx, px(max - 4), y, px(max) + 42, y, C.muted, 4);
      for (let s = max - 4; s <= max; s++) {
        api.line(ctx, px(s), y - 10, px(s), y + 12, C.muted, 3);
        label(String(s), px(s), y + 58, 29, C.muted, 'center');
        if (offset >= 1) label(String(s - max), px(s), y + 145, 35, C.yellow, 'center');
      }
      scores.forEach((s, i) => {
        api.circle(ctx, px(s), y, 12, colors[i]);
        api.line(ctx, px(s), y - 22, px(s), y - 83, colors[i], 3);
      });
      api.line(ctx, px(scores[1]), y - 77, px(max), y - 77, C.ink, 3);
      label('2 log units', (px(max) + px(scores[1])) / 2, y - 104, 37, C.ink, 'center');
      if (offset > 0) {
        api.line(ctx, px(max), y + 71, px(max), y + 71 + 37 * offset, C.yellow, 4);
        label('After subtracting the maximum', 260, 761, 32, C.yellow);
      }
    });
    api.focus.target('score-weights', () => {
      label(offset === 0 ? 'Exponentiate directly' : 'Exponentiate the differences',
        1120, 261, 36);
      scores.forEach((s, i) => {
        const y = 387 + 162 * i;
        if (offset === 0) {
          label('exp(' + s + ')', 1120, y, 38, colors[i]);
          if (f.completed('stable-underflow', 0)) label('= ' + raw[i], 1460, y, 43, colors[i]);
        } else if (offset >= 1) {
          label('exp(' + shifted[i] + ')', 1120, y, 38, colors[i]);
          if (exponentiate > 0) {
            api.rect(ctx, 1120, y + 26, 510 * weights[i] * exponentiate, 41, colors[i], undefined, 0);
            if (exponentiate >= 1) label('≈ ' + weights[i].toFixed(4), 1460, y, 38, colors[i]);
          }
        }
      });
      if (f.completed('stable-underflow', 0) && offset === 0) {
        label(f.completed('stable-undefined', 1) ? '0 / (0 + 0) is undefined' : '0 / (0 + 0) = ?',
          1120, 727, 38, C.yellow);
      }
      if (exponentiate >= 1) label('Sum ≈ ' + sum.toFixed(4), 1120, 727, 36);
    });
    api.focus.target('stable-share', () => {
      if (show) {
        const left = 345;
        const width = 1230;
        let start = left;
        memberships.forEach((p, i) => {
          api.rect(ctx, start, 852, width * p, 72, colors[i], undefined, 0);
          label(p.toFixed(4), start + width * p / 2, 901, 35, C.bg, 'center');
          start += width * p;
        });
        label('Memberships after normalization', 960, 980, 31, C.muted, 'center');
      } else {
        label(f.beat === 0 && f.completed('stable-underflow', 0) ? 'Can we divide by this sum?' :
          'First share = first weight / sum of both weights', 960, 906, 36, C.ink, 'center');
      }
    });
    return;
  }

  if (f.beat === 3) {
    api.focus.target('stable-check', () => {
      label('Check the maximum before shifting', 200, 277, 40);
      [
        ['Log scores', 'Maximum', 'Next step'],
        ['−1000,  −1002', String(max), 'Shift and normalize'],
        ['−∞,  −∞', '−∞', 'Stop and inspect the model'],
      ].forEach((row, i) => {
        const color = [C.muted, C.green, C.yellow][i];
        row.forEach((s, j) => label(s, [200, 772, 1180][j], 410 + 152 * i, i ? 37 : 31, color));
      });
      if (f.progress('stable-empty', 3) > 0) {
        label('Effective count below 10⁻¹²   →   restart the fit', 200, 940, 36, C.yellow);
      }
    });
    return;
  }

  const mu = firstUpdate.means[0];
  const count = firstUpdate.effective[0];
  api.focus.target('weighted-deviations', () => {
    label('First component after the mean update', 180, 265, 38);
    ['Request', 'Fast share', 'Squared distance from ' + mu.toFixed(2) + ' ms',
      'Weighted squared distance'].forEach((s, i) => label(s, [180, 465, 780, 1280][i], 365, 27, C.muted));
    observations.forEach((x, i) => {
      const r = firstResponsibilities[i][0];
      const d = (x - mu) ** 2;
      const y = 445 + 72 * i;
      const color = x === 94 ? C.yellow : C.blue;
      label(x + ' ms', 180, y, 31, color);
      label(r.toFixed(3), 465, y, 31, color);
      label(d.toFixed(1) + ' ms²', 780, y, 31, color);
      api.rect(ctx, 1280, y - 23, r * d * 0.82, 24, color, undefined, 0);
      label((r * d).toFixed(1), 1570, y, 29, color);
    });
    label('Variance ≈ ' + (firstUpdate.variances[0] * count).toFixed(1) + ' / ' +
      count.toFixed(3) + ' ≈ ' + firstUpdate.variances[0].toFixed(2) + ' ms²',
      180, 960, 38);
  });
}
export default {
  id: 'stable-responsibilities',
  draw: drawStableResponsibilities,
  cues: ['stable-underflow', 'stable-undefined', 'stable-shift', 'stable-exponentials', 'stable-normalize',
    'stable-invalid', 'stable-empty', 'stable-distance'],
};
