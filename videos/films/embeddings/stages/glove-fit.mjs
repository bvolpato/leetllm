import { gloveResidual } from '../arithmetic.mjs';
import { completed, event } from '../construction.mjs';
import { centeredText, extensionText, footer, line } from '../defaults.mjs';
export function drawGloveFit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('glove-fit-mechanism', () => {
    const counts = [3, 30, 300],
      rows = counts.map((n) => gloveResidual(n)),
      x = (v) => 480 + (v / 6) * 700;
    centeredText(ctx, api, 'Fixed supplied score = ln(30)', 960, 285, 36, themeColors.yellow);
    if (currentBeat === 2)
      api.math(
        ctx,
        String.raw`f(x)=\min(1,(x/100)^{3/4})`,
        960,
        350,
        34,
        themeColors.yellow,
        'center',
      );
    rows.forEach((r, i) => {
      const y = 440 + i * 190;
      extensionText(ctx, api, 'count ' + r.count, 200, y, 32, themeColors.cyan);
      line(ctx, api, 460, y, 1200, y, themeColors.muted);
      for (let j = 0; j <= 6; j++) line(ctx, api, x(j), y - 7, x(j), y + 7, themeColors.muted);
      api.circle(ctx, x(r.target), y, 9, themeColors.cyan);
      line(ctx, api, x(r.score), y - 24, x(r.score), y + 24, themeColors.yellow, 4);
      const residualProgress = currentBeat > 0 ? ev('glove-log-targets', 1) : ev('glove-score', 0);
      line(
        ctx,
        api,
        x(r.score),
        y + 35,
        x(r.score) + (x(r.target) - x(r.score)) * residualProgress,
        y + 35,
        themeColors.pink,
        8,
      );
      const visible = i === 1 ? done('glove-zero', 1) : done('glove-error', 1);
      centeredText(
        ctx,
        api,
        visible ? 'squared error ' + fmt(r.squared) : 'log target ' + fmt(r.target),
        1490,
        y + 5,
        32,
        visible ? themeColors.green : themeColors.muted,
      );
      if (currentBeat === 2) {
        const complete = done('glove-weight-values', 2);
        if (complete) api.rect(ctx, 1280, y + 50, 420 * r.weight, 24, themeColors.cyan);
        extensionText(
          ctx,
          api,
          complete ? 'weight ' + fmt(r.weight) : 'weight pending',
          1280,
          y + 115,
          28,
          complete ? themeColors.cyan : themeColors.muted,
        );
      }
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? done('glove-weight-values', 2)
          ? 'Weight caps at count 100; the retained count 300 also has weight 1.'
          : 'Weight cap begins at count 100; the supplied counts remain fixed.'
        : 'Cyan: log count · yellow: model dot + two biases · pink: residual distance before squaring',
    );
  });
}
export default {
  id: 'glove-fit',
  draw: drawGloveFit,
  cues: [
    'emb-glove-score',
    'emb-glove-log-targets',
    'emb-glove-zero',
    'emb-glove-error',
    'emb-glove-weights',
    'emb-glove-weight-values',
  ],
};
