import { MSE } from '../arithmetic.mjs';
import { DELAY_FIXTURE } from '../fixtures.mjs';
import { TRACKS, boostCue, establishedProgress } from '../construction.mjs';
import { focusScope, legacyEquation, legacyText, recordCard } from '../defaults.mjs';
export function drawResidual(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const once = (firstBeat = 0, from = 0.08, to = 0.82) =>
    establishedProgress(state, firstBeat, from, to);
  const snapshot = TRACKS['residual'].sample({
      beat,
      beatP: progress,
    }).snapshot,
    completed = (id, b = beat) => boostCue(state, id, b) === 1;
  {
    const plot = teaching.axes({
      x: 250,
      y: 360,
      width: 880,
      height: 450,
      xDomain: [-0.5, 2.5],
      yDomain: [0, 22],
      xTicks: [0, 1, 2],
      yTicks: [0, 6, 12, 18],
      xLabel: 'job row',
      yLabel: 'delay · hours',
      fontSize: 25,
    });
    const activeRows = snapshot.stage === 0 ? 3 : snapshot.stage === 1 ? 3 : 3;
    const updated = snapshot.stage >= 2;
    const updateProgress = state.cues?.['residual-new-predictions']
      ? api.focus.progress('residual-new-predictions', phaseForBeat(0.05, 0.75))
      : phaseForBeat(0.05, 0.75);
    const currentPredictions = DELAY_FIXTURE.initial.map((initial, index) =>
      updated ? api.lerp(initial, snapshot.updated[index], updateProgress) : initial,
    );
    const colors = [themeColors.cyan, themeColors.yellow, themeColors.pink];
    focusScope(ctx, api, 'residual-simulation-7', () =>
      DELAY_FIXTURE.actual.forEach((actual, index) => {
        const x = index;
        const initial = DELAY_FIXTURE.initial[index];
        const final = currentPredictions[index];
        const top = plot.point(x, actual);
        const current = plot.point(x, final);
        const start = plot.point(x, initial);
        focusScope(ctx, api, 'residual-object-start-top-8', () =>
          api.path(ctx, [start, top], {
            color: colors[index],
            width: 4,
            clip: plot.bounds,
            opacity: 0.72,
          }),
        );
        api.circle(ctx, top.x, top.y, 11, colors[index]);
        api.circle(ctx, current.x, current.y, 12, themeColors.green);
        legacyText(ctx, api, `actual ${actual}`, top.x - 22, top.y + 6, 24, colors[index], 'right');
        legacyText(
          ctx,
          api,
          `pred ${final.toFixed(2)}`,
          current.x + 22,
          current.y + 6,
          24,
          themeColors.green,
          'left',
        );
      }),
    );
    const left = recordCard(
      ctx,
      api,
      'residual',
      'Rows 1 + 2',
      1240,
      420,
      420,
      75,
      themeColors.blue,
      once(0, 0.1, 0.7),
      26,
    );
    const right = focusScope(ctx, api, 'residual-object-large-model-row-14', () =>
      recordCard(
        ctx,
        api,
        'residual',
        'Large-model row',
        1240,
        545,
        420,
        75,
        themeColors.pink,
        once(0, 0.2, 0.78),
        26,
      ),
    );
    const leftLeaf = focusScope(
      ctx,
      api,
      'residual-object-snapshot-corrections-mean-residual-snapshot-correc-15',
      () =>
        recordCard(
          ctx,
          api,
          'residual',
          snapshot.corrections && completed('gbt-residual-leaf-means', 1)
            ? `Mean residual · ${snapshot.corrections[0]}`
            : 'Mean residual',
          1240,
          635,
          420,
          75,
          themeColors.yellow,
          snapshot.corrections ? once(1, 0.18, 0.75) : 0.4,
          26,
        ),
    );
    const rightLeaf = recordCard(
      ctx,
      api,
      'residual',
      snapshot.corrections && completed('gbt-residual-leaf-means', 1)
        ? `Mean residual · +${snapshot.corrections[1]}`
        : 'Mean residual',
      1240,
      750,
      420,
      75,
      themeColors.pink,
      snapshot.corrections ? once(1, 0.28, 0.82) : 0.4,
      26,
    );
    const treeOpacity = snapshot.corrections ? once(1, 0.16, 0.78) : 0.3;
    api.path(
      ctx,
      [
        {
          x: 1660,
          y: 457.5,
        },
        {
          x: 1710,
          y: 457.5,
        },
        {
          x: 1710,
          y: 672.5,
        },
        {
          x: 1660,
          y: 672.5,
        },
      ],
      {
        color: themeColors.yellow,
        width: 3,
        opacity: treeOpacity,
      },
    );
    api.path(
      ctx,
      [
        {
          x: 1660,
          y: 582.5,
        },
        {
          x: 1750,
          y: 582.5,
        },
        {
          x: 1750,
          y: 787.5,
        },
        {
          x: 1660,
          y: 787.5,
        },
      ],
      {
        color: themeColors.pink,
        width: 3,
        opacity: treeOpacity,
      },
    );
    legacyText(
      ctx,
      api,
      completed('residual-beat-2-focus-1', 1)
        ? `Residuals · ${snapshot.residuals.join(', ')}`
        : 'Residual list pending',
      1450,
      858,
      27,
      themeColors.yellow,
      'center',
    );
    focusScope(ctx, api, 'residual-current-mse', () =>
      legacyText(
        ctx,
        api,
        `Learning rate ν = ${DELAY_FIXTURE.learningRate} · MSE ${MSE(currentPredictions).toFixed(3)} h²`,
        960,
        916,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    legacyEquation(
      ctx,
      api,
      String.raw`F_m(x)=F_{m-1}(x)+\nu h_m(x)`,
      960,
      968,
      37,
      themeColors.ink,
    );
    void activeRows;
  }
}
export default {
  id: 'residual',
  draw: drawResidual,
  cues: [
    'residual-beat-1-focus-1',
    'residual-beat-1-focus-2',
    'residual-beat-2-focus-1',
    'residual-beat-2-focus-2',
    'gbt-residual-leaf-means',
    'residual-beat-3-focus-1',
    'residual-beat-3-focus-2',
    'residual-new-predictions',
  ],
};
