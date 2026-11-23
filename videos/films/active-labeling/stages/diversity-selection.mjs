import { euclidean } from '../arithmetic.mjs';
import { selectionItems } from '../fixtures.mjs';
import { phase, sampleModel } from '../construction.mjs';
import { hybridSteps } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawDiversitySelection(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('diversity-selection', state);
  {
    if (state.cues?.['seed-selection']) {
      const count = api.focus.visible('seed-selection')
        ? 1 + Math.floor(3 * api.focus.progress('select-diverse', 0) + 1e-9)
        : 0;
      const steps = hybridSteps();
      modelState.count = count;
      modelState.selected = count ? steps[count - 1].selected : [];
      modelState.step = count ? steps[count - 1] : null;
      modelState.baseline = [...selectionItems]
        .sort((a, b) => b.uncertainty - a.uncertainty)
        .slice(0, count);
    }
    const colors = {
        canary: themeColors.blue,
        handoff: themeColors.cyan,
        injection: themeColors.pink,
        accessibility: themeColors.green,
      },
      selected = new Set(modelState.selected.map((item) => item.id));
    const plot = teaching.axes({
      x: 160,
      y: 350,
      width: 940,
      height: 470,
      equalUnits: true,
      xDomain: [-5, 6],
      yDomain: [-5, 6],
      xTicks: [-4, 0, 4],
      yTicks: [-4, 0, 4],
      xLabel: 'embedding coordinate 1',
      yLabel: 'embedding coordinate 2',
    });
    api.focus.target('embedding-candidates', () =>
      teaching.scatter({
        plot,
        points: selectionItems.map((item) => ({
          x: item.xy[0],
          y: item.xy[1],
          color: selected.has(item.id) ? themeColors.yellow : colors[item.domain],
          radius: selected.has(item.id) ? 12 : 8,
        })),
      }),
    );
    const preview =
      modelState.selected.length === 1 && beat > 0 ? hybridSteps()[1] : modelState.step;
    const previous =
        modelState.selected.length === 1 ? modelState.selected : modelState.selected.slice(0, -1),
      latest = preview?.chosen;
    if (latest && previous.length) {
      const nearest = previous.reduce(
          (best, item) =>
            euclidean(item.xy, latest.item.xy) < euclidean(best.xy, latest.item.xy) ? item : best,
          previous[0],
        ),
        a = plot.point(...latest.item.xy),
        z = plot.point(...nearest.xy);
      api.focus.target('nearest-neighbor', () =>
        api.line(ctx, a.x, a.y, z.x, z.y, themeColors.yellow, 3),
      );
      api.focus.target('nearest-neighbor', () =>
        text(
          ctx,
          api,
          `nearest distance ${latest.distance.toFixed(2)}`,
          650,
          925,
          26,
          themeColors.yellow,
          'center',
        ),
      );
    }
    text(ctx, api, 'Three nearby canary variants', 720, 265, 27, themeColors.blue, 'center');
    modelState.selected.forEach((item) => {
      const point = plot.point(...item.xy);
      if (item.id === 'injection')
        api.line(ctx, point.x + 20, point.y + 5, point.x + 160, point.y + 5, themeColors.yellow, 2);
      text(
        ctx,
        api,
        item.id,
        point.x +
          (item.id === 'canary-1'
            ? -25
            : item.id === 'injection'
              ? 180
              : item.id === 'keyboard'
                ? 120
                : 0),
        point.y +
          (item.id === 'canary-1'
            ? latest?.item.xy[1] < 0
              ? -45
              : 60
            : item.id === 'injection'
              ? 15
              : item.id === 'keyboard'
                ? 0
                : -28),
        25,
        themeColors.yellow,
        item.id === 'canary-1' ? 'right' : item.id === 'injection' ? 'left' : 'center',
      );
    });
    const coverage = (rows) => new Set(rows.map((item) => item.domain)).size;
    text(
      ctx,
      api,
      `Candidate scores · uncertainty-only covers ${coverage(modelState.baseline)} ${coverage(modelState.baseline) === 1 ? 'domain' : 'domains'}`,
      1470,
      315,
      24,
      themeColors.blue,
      'center',
    );
    (preview?.ranked ?? []).slice(0, 3).forEach((row, i) => {
      api.focus.target('candidate-scores', () =>
        text(ctx, api, row.item.id, 1250, 380 + i * 80, 26, themeColors.blue),
      );
      api.focus.target('candidate-scores', () =>
        text(
          ctx,
          api,
          `U ${row.item.uncertainty.toFixed(2)} · d ${row.distance.toFixed(2)} · score ${row.score.toFixed(3)}`,
          1250,
          415 + i * 80,
          23,
          themeColors.muted,
        ),
      );
    });
    api.focus.target('hybrid-queue', () =>
      text(
        ctx,
        api,
        `Hybrid · ${coverage(modelState.selected)} ${coverage(modelState.selected) === 1 ? 'domain' : 'domains'}`,
        1470,
        650,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    modelState.selected.forEach((item, i) =>
      api.focus.target('hybrid-queue', () =>
        text(ctx, api, `${i + 1}. ${item.id}`, 1300, 715 + i * 48, 27, themeColors.yellow),
      ),
    );
    text(
      ctx,
      api,
      modelState.step
        ? `Latest selection: ${modelState.step.chosen.item.id} · score ${modelState.step.chosen.score.toFixed(3)}`
        : 'Seed with the highest-uncertainty item.',
      960,
      960,
      28,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'diversity-selection',
  draw: drawDiversitySelection,
  cues: [
    'near-duplicates',
    'seed-selection',
    'nearest-distance',
    'combine-score',
    'fill-quota',
    'select-diverse',
    'geometry-limit',
  ],
};
