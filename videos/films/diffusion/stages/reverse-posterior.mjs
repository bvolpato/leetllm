import { posteriorFixture } from '../model.mjs';
import { afterPhrase, cueProgress, decimal } from '../pixel-study.mjs';

const posterior = posteriorFixture();
const density = (x, mean) =>
  Math.exp(-((x - mean) ** 2) / (2 * posterior.within)) / Math.sqrt(2 * Math.PI * posterior.within);

export function drawReversePosterior(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.pink];
  const x = (v) => 170 + (v + 2.25) * 225;
  const y = (v) => 740 - 555 * v;
  const points = Array.from({ length: 161 }, (_, i) => -2.25 + (4.5 * i) / 160);
  const mixed = cueProgress(state, 'causes-mix', 2);
  const halve = cueProgress(state, 'causes-half', 2);
  const show = [cueProgress(state, 'cause-dark', 1), cueProgress(state, 'cause-light', 1)];
  const total = afterPhrase(state, 'causes-total', 2);
  api.focus.target('posterior-density', () => {
    api.text(
      ctx,
      state.beat === 0 ? 'Two clean values, one observation' : 'Density of the previous state',
      165,
      264,
      36,
      C.ink,
    );
    api.line(ctx, x(-2.25), y(0), x(2.25), y(0), C.muted, 3);
    for (const tick of [-2, -1, 0, 1, 2]) {
      api.line(ctx, x(tick), y(0) - 6, x(tick), y(0) + 12, C.muted, 2);
      api.text(ctx, String(tick).replace('-', '−'), x(tick), y(0) + 54, 30, C.muted, 'center');
    }
    if (state.beat === 0) {
      for (const [i, clean] of [-1, 1].entries()) {
        api.circle(ctx, x(clean), 529, 15, colors[i]);
        api.arrow(ctx, x(clean) - clean * 23, 529, x(0) + clean * 29, 529, colors[i], 5);
        api.text(ctx, i === 0 ? 'Dark' : 'Light', x(clean), 612, 34, colors[i], 'center');
      }
      api.text(ctx, 'Observed now', x(0), 455, 32, C.muted, 'center');
      api.circle(ctx, x(0), 529, 20, C.yellow);
      api.text(ctx, 'x = 0', x(0), 611, 47, C.yellow, 'center');
    }
    posterior.means.forEach((mean, i) => {
      if (show[i] <= 0) return;
      // Reveal the density from left to right. Its height always has probability-density units.
      const visible = points.slice(0, 1 + Math.round((points.length - 1) * show[i]));
      const weight = 1 - 0.5 * halve;
      if (visible.length > 1)
        api.path(
          ctx,
          visible.map((v) => ({ x: x(v), y: y(weight * density(v, mean)) })),
          { color: colors[i], width: 5 },
        );
      api.circle(ctx, x(mean), y(0), 9, colors[i]);
    });
    if (mixed > 0) {
      const visible = points.slice(0, 1 + Math.round((points.length - 1) * mixed));
      if (visible.length > 1)
        api.path(
          ctx,
          visible.map((v) => ({
            x: x(v),
            y: y(posterior.means.reduce((sum, mean) => sum + density(v, mean) / 2, 0)),
          })),
          { color: C.yellow, width: 7 },
        );
    }
    api.text(
      ctx,
      state.beat === 0 ? 'Normalized brightness' : 'Previous pixel value',
      x(0),
      865,
      33,
      C.muted,
      'center',
    );
  });
  api.focus.target('posterior-causes', () => {
    api.text(ctx, 'Clean pixel', 1280, 270, 36, C.muted);
    for (const [i, label] of ['Dark   −1', 'Light   +1'].entries()) {
      const yy = 378 + 145 * i;
      api.circle(ctx, 1292, yy - 14, 12, colors[i]);
      api.text(ctx, label, 1330, yy, 44, colors[i]);
      const details =
        show[i] === 1
          ? `Mean  ${decimal(posterior.means[i])}    ·    variance  ⅓`
          : 'Prior chance   ½';
      api.text(ctx, details, 1280, yy + 51, 29, C.ink);
    }
    api.text(ctx, 'Observed x = 0', 1280, 720, 31, C.yellow);
    api.text(ctx, 'Previous ᾱ = 0.50   ·   β = 0.50', 1280, 790, 28, C.muted);
    api.text(ctx, 'Current ᾱ = 0.25', 1280, 842, 28, C.muted);
  });
  api.focus.target('posterior-variance', () => {
    const footer =
      state.beat === 0
        ? 'Which distribution should we use for the step back?'
        : state.beat === 1
          ? 'Known clean pixel → one conditional Gaussian'
          : total
            ? 'Variance   ⅓ within the curves  +  2/9 between the means  =  5/9'
            : 'Equal mixture   =   ½ × dark curve  +  ½ × light curve';
    api.text(ctx, footer, 960, 991, 36, total ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'reverse-posterior',
  draw: drawReversePosterior,
  cues: [
    'causes-observed',
    'cause-dark',
    'cause-light',
    'causes-half',
    'causes-mix',
    'causes-total',
  ],
};
