import { human, judge, labels } from '../fixtures.mjs';
import { humanCounts, judgeCounts, matches } from '../model.mjs';

const n = human.length;
const products = labels.map((label) => humanCounts[label] * judgeCounts[label]);
const chanceCount = products.reduce((sum, count) => sum + count, 0);
const combinations = n * n;
const observedCount = n * matches;
const adjustedGain = observedCount - chanceCount;
const possibleGain = combinations - chanceCount;

function crossLabels(ctx, api) {
  const { C, focus } = api;
  const cell = 61;
  const byFrequency = (counts) => labels.flatMap((label) => Array(counts[label]).fill(label));
  const rows = byFrequency(humanCounts);
  const cols = byFrequency(judgeCounts);
  const colors = [C.green, C.cyan, C.yellow];
  const cues = ['compact-product', 'step-product', 'tie-product'];
  const progress = cues.map((cue) => focus.progress(cue, 0));

  focus.target('chance-products', () => {
    api.text(ctx, 'Judge labels', 572, 280, 36, C.ink, 'center');
    api.text(ctx, 'Human labels', 120, 346, 32, C.ink);
    let left = 330,
      top = 383;
    labels.forEach((label, k) => {
      const w = cell * judgeCounts[label],
        h = cell * humanCounts[label];
      api.text(ctx, label, left + w / 2, 344, 28, colors[k], 'center');
      api.text(ctx, label, 298, top + h / 2 + 11, 30, colors[k], 'right');
      left += w;
      top += h;
    });
    rows.forEach((h, r) =>
      cols.forEach((j, c) => {
        const k = labels.indexOf(h);
        const index = (r - rows.indexOf(h)) * judgeCounts[h] + c - cols.indexOf(h);
        const marked = h === j && index < Math.ceil(progress[k] * products[k]);
        api.rect(
          ctx,
          330 + c * cell,
          383 + r * cell,
          cell - 5,
          cell - 5,
          marked ? colors[k] : C.panel,
          marked ? colors[k] : C.muted,
          3,
        );
      }),
    );
    api.text(ctx, n + ' human choices × ' + n + ' judge choices', 510, 945, 32, C.muted, 'center');
  });

  focus.target('chance-baseline', () => {
    api.text(ctx, 'Same label on both draws', 1030, 283, 39, C.ink);
    labels.forEach((label, k) => {
      if (progress[k] === 1)
        api.text(
          ctx,
          label + '     ' + humanCounts[label] + ' × ' + judgeCounts[label] + ' = ' + products[k],
          1030,
          377 + 63 * k,
          38,
          colors[k],
        );
    });
    if (focus.progress('chance-baseline', 0) === 1)
      api.math(
        ctx,
        'p_e=\\frac{' +
          products.join('+') +
          '}{' +
          n +
          '^2}=\\frac{' +
          chanceCount +
          '}{' +
          combinations +
          '}',
        1390,
        630,
        48,
        C.yellow,
        'center',
      );
    if (focus.progress('chance-observed', 0) === 1)
      api.math(
        ctx,
        'p_o=\\frac' + matches + n + '=\\frac{' + observedCount + '}{' + combinations + '}',
        1390,
        747,
        47,
        C.green,
        'center',
      );
  });
  if (focus.visible('earned-kappa'))
    focus.target('earned-kappa', () => {
      api.text(ctx, 'Gain above baseline / possible gain', 1390, 839, 32, C.muted, 'center');
      if (focus.progress('earned-kappa', 0) === 1)
        api.math(
          ctx,
          '\\kappa=\\frac{' +
            observedCount +
            '-' +
            chanceCount +
            '}{' +
            combinations +
            '-' +
            chanceCount +
            '}=\\frac{' +
            adjustedGain +
            '}{' +
            possibleGain +
            '}',
          1390,
          949,
          50,
          C.ink,
          'center',
        );
    });
}

export function drawAgreement(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 3) return crossLabels(ctx, api);
  const reveal = focus.progress('human-labels', 0);
  const scored = focus.progress('observed-matches', 0) === 1;
  focus.target('paired-labels', () => {
    ['Case', 'Human', 'Judge'].forEach((v, i) =>
      api.text(ctx, v, [185, 470, 835][i], 315, 36, C.muted, 'center'),
    );
    human.forEach((value, i) => {
      const y = 401 + 73 * i;
      api.text(ctx, String(i + 1).padStart(2, '0'), 185, y, 32, C.muted, 'center');
      if (i >= Math.ceil(reveal * n)) return;
      const same = value === judge[i];
      api.text(ctx, value, 470, y, 41, C.ink, 'center');
      api.text(ctx, judge[i], 835, y, 41, C.ink, 'center');
      if (scored) api.text(ctx, same ? '=' : '≠', 655, y, 37, same ? C.green : C.pink, 'center');
    });
  });
  api.line(ctx, 1055, 265, 1055, 962, C.muted, 2);
  if (!focus.visible('observed-matches')) {
    api.text(ctx, 'How many of the eight', 1425, 513, 45, C.ink, 'center', 'serif');
    api.text(ctx, 'rows match?', 1425, 582, 45, C.ink, 'center', 'serif');
    return;
  }
  focus.target('observed-agreement', () => {
    api.text(ctx, 'Observed agreement', 1450, 290, 32, C.muted, 'center');
    if (scored)
      api.math(
        ctx,
        'p_o = \\frac{' + matches + '}{' + n + '}=' + (matches / n).toFixed(2),
        1450,
        390,
        48,
        C.green,
        'center',
      );
  });
  if (focus.visible('expected-matches')) {
    focus.target('label-margins', () => {
      api.text(ctx, 'Label', 1130, 500, 30, C.muted);
      api.text(ctx, 'Human', 1500, 500, 30, C.muted, 'center');
      api.text(ctx, 'Judge', 1690, 500, 30, C.muted, 'center');
      labels.forEach((label, i) => {
        const y = 562 + i * 55;
        api.text(ctx, label, 1130, y, 34, C.ink);
        api.text(ctx, String(humanCounts[label]), 1500, y, 35, C.ink, 'center');
        api.text(ctx, String(judgeCounts[label]), 1690, y, 35, C.ink, 'center');
      });
    });
    focus.target('expected-agreement', () => {
      api.text(ctx, 'Independent-draw baseline', 1450, 760, 31, C.muted, 'center');
      if (focus.progress('expected-matches', 0) === 1)
        api.math(
          ctx,
          'p_e=\\frac{' +
            chanceCount +
            '}{' +
            combinations +
            '}\\approx' +
            (chanceCount / combinations).toFixed(2),
          1450,
          835,
          46,
          C.yellow,
          'center',
        );
    });
  }
  if (focus.visible('adjust-agreement'))
    focus.target('kappa', () => {
      if (focus.progress('adjust-agreement', 0) === 1)
        api.math(
          ctx,
          '\\kappa\\approx' + (adjustedGain / possibleGain).toFixed(2),
          1450,
          965,
          47,
          C.ink,
          'center',
        );
      else api.text(ctx, 'Adjusted agreement', 1450, 965, 32, C.muted, 'center');
    });
}

export default {
  id: 'agreement',
  draw: drawAgreement,
  cues: [
    'human-labels',
    'sample-rows',
    'count-rows',
    'observed-matches',
    'expected-matches',
    'adjust-agreement',
    'report-confusion',
    'chance-products',
    'compact-product',
    'step-product',
    'tie-product',
    'chance-baseline',
    'chance-observed',
    'earned-kappa',
  ],
};
