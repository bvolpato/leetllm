import { event } from '../construction.mjs';
import { sensitivityFrame } from '../model.mjs';
import { caption, chart, curve, target, text } from '../defaults.mjs';
export function drawSensitivity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const v = sensitivityFrame(state),
      colors = [themeColors.blue, themeColors.yellow, themeColors.pink];
    text(
      ctx,
      api,
      v.processed
        ? v.passes + ' passes and ' + v.fails + ' failures included in each update'
        : 'Same ten results waiting for each prior',
      960,
      265,
      32,
      themeColors.ink,
      'center',
    );
    v.cases.forEach((row, i) => {
      const x = 120 + i * 610,
        q = chart(ctx, api, {
          x,
          y: 420,
          width: 470,
          height: 330,
          max: 10,
          ticks: [0, 0.5, 1],
          xLabel: 'candidate rate',
        });
      text(
        ctx,
        api,
        'Starting Beta(' + row.prior.join(',') + ')',
        x + 235,
        345,
        29,
        colors[i],
        'center',
      );
      curve(ctx, api, q, row.prior[0], row.prior[1], colors[i] + '66', 3);
      target(ctx, api, 'prior-case-' + i, () => curve(ctx, api, q, row.a, row.b, colors[i]));
      const meanAt = q.point(row.mean, 0);
      api.line(ctx, meanAt.x, meanAt.y - 50, meanAt.x, meanAt.y, colors[i], 5);
      text(
        ctx,
        api,
        (v.processed ? 'posterior mean ' : 'prior mean ') + row.mean.toFixed(3),
        x + 235,
        860,
        30,
        colors[i],
        'center',
      );
      if (currentBeat === 0 && i === 2)
        target(ctx, api, 'prior-history', () => {
          const history = event(state, 0, 'prior-provenance', 0.55, 0.85);
          text(
            ctx,
            api,
            history > 0 ? 'Beta(1,1) + 19 passes + 19 failures' : 'Which historical baseline?',
            x + 235,
            930,
            27,
            themeColors.muted,
            'center',
          );
        });
      if (v.processed === 10)
        text(
          ctx,
          api,
          'P(p>0.7) = ' + (100 * row.tail).toFixed(1) + '%',
          x + 235,
          930,
          26,
          colors[i],
          'center',
        );
    });
    caption(
      ctx,
      api,
      currentBeat === 0
        ? 'Prior parameters encode justified assumptions · record the earlier baseline and historical evidence'
        : v.processed === 10
          ? 'Only the starting assumption changed · all three choices still miss the 95% evidence rule'
          : 'The same data update every prior · compare how far each center moves',
    );
  }
}
export default {
  id: 'sensitivity',
  draw: drawSensitivity,
  cues: ['compare-starting-priors', 'prior-provenance', 'same-data-three-priors'],
};
