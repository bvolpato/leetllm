import { line, text } from '../defaults.mjs';
import { delayedErrorCostLimit } from '../fixtures.mjs';
import { simulateRelease } from '../model.mjs';
import { costRuler, errorTiles, releaseWindow } from '../release-cost.mjs';
import { monitoringScene } from '../storyboard.mjs';

const incomplete = { mature: 400, joined: 380 };
const large = releaseWindow(800, 800, 8, 2);
const smaller = releaseWindow(600, 600, 8, 2);

function drawCoverage(ctx, api, cue) {
  const { C } = api;
  const perTile = 20;
  const x = (i) => 560 + i * 45;
  text(ctx, api, 'v4   /   offline and fast gates passed', 150, 265, 38, C.blue, 'left');
  text(ctx, api, 'Each square holds 20 predictions', 150, 348, 31, C.muted, 'left');
  text(ctx, api, 'Minimum 500', x(25), 398, 32, C.yellow);
  line(ctx, api, x(25), 416, x(25), 526, C.yellow, 4);
  const rows = [
    [incomplete.mature, 'Mature at cutoff', C.blue],
    [incomplete.joined, 'Labels joined', C.pink],
  ];
  rows.forEach(([count, name, color], j) => {
    const y = 466 + j * 144;
    text(ctx, api, name, 150, y - 8, 31, C.ink, 'left');
    const show = j === 0 || cue.started('arrived');
    if (show) text(ctx, api, count, 150, y + 42, 42, color, 'left');
    const slots = j === 0 ? 25 : incomplete.mature / perTile;
    for (let i = 0; i < slots; i++) {
      const filled =
        j === 0 ? i < count / perTile : i < Math.round((cue.progress('arrived') * count) / perTile);
      api.rect(ctx, x(i), y, 36, 36, filled ? color : C.panel, filled ? undefined : C.muted, 3);
    }
  });
  if (cue.done('coverage'))
    text(
      ctx,
      api,
      `${incomplete.joined} / ${incomplete.mature} = ${(incomplete.joined / incomplete.mature).toFixed(2)}` +
        (cue.done('missing-result')
          ? `   ·   ${incomplete.mature - incomplete.joined} mature outcomes missing`
          : ''),
      960,
      776,
      38,
      C.yellow,
    );
  if (cue.done('hold')) {
    text(
      ctx,
      api,
      `${simulateRelease(incomplete).action} · count < 500 and incomplete labels`,
      960,
      905,
      36,
      C.yellow,
    );
  } else if (cue.started('ask') && !cue.started('coverage')) {
    text(ctx, api, 'Can we use this window for a release decision?', 960, 905, 43, C.yellow);
  }
}

export default monitoringScene(
  'fresh-monitoring',
  [
    'arrived',
    'ask',
    'coverage',
    'missing-result',
    'hold',
    'window',
    'alerts',
    'errors',
    'place',
    'cost',
    'normalized',
    'keep',
    'smaller',
    'predict',
    'sixty',
    'return',
    'verify',
  ],
  (ctx, api, cue) => {
    if (!cue.started('window')) return drawCoverage(ctx, api, cue);
    const { C } = api;
    const second = cue.started('smaller');
    const sample = second ? smaller : large;
    text(
      ctx,
      api,
      `v4   /   ${sample.mature} mature predictions   /   ${sample.joined} labels joined`,
      155,
      250,
      37,
      C.blue,
      'left',
    );
    errorTiles(ctx, api, sample, cue.progress('alerts'), cue.progress('errors'));
    if (cue.done('cost')) {
      text(ctx, api, `2×${sample.fp} + 10×${sample.fn} = ${sample.raw}`, 488, 527, 39, C.ink);
      const known = second ? cue.done('sixty') : cue.done('normalized');
      text(
        ctx,
        api,
        `${sample.raw} × 1,000 / ${sample.mature} = ${known ? sample.perThousand : '?'}`,
        1320,
        527,
        39,
        C.ink,
      );
    }
    const tracks = [
      {
        n: large.mature,
        value: cue.started('normalized') ? large.perThousand : null,
        progress: cue.progress('normalized'),
        label: cue.done('normalized'),
        color: C.cyan,
      },
    ];
    if (second)
      tracks.push({
        n: smaller.mature,
        value: cue.started('sixty') ? smaller.perThousand : null,
        progress: cue.progress('sixty'),
        label: cue.done('sixty'),
        color: C.pink,
      });
    costRuler(ctx, api, tracks);
    if (second && cue.done('keep')) text(ctx, api, 'Keep v4', 1658, 734, 28, C.cyan, 'right');
    if (cue.done('return')) text(ctx, api, 'Propose v3', 1658, 846, 28, C.pink, 'right');
    if (cue.started('verify')) {
      text(
        ctx,
        api,
        'Verify v3 on new requests. Measure cost on its next mature cohort.',
        960,
        934,
        34,
        C.ink,
      );
    } else if (cue.done('return')) {
      text(
        ctx,
        api,
        `${sample.perThousand} > ${delayedErrorCostLimit}   ·   ${sample.receipt.action} to ${sample.receipt.alias}`,
        960,
        929,
        39,
        C.yellow,
      );
    } else if (second) {
      if (cue.started('predict') && !cue.started('sixty'))
        text(
          ctx,
          api,
          '600 predictions: keep v4 or propose a return to v3?',
          960,
          929,
          40,
          C.yellow,
        );
    } else if (cue.done('keep')) {
      text(
        ctx,
        api,
        `${large.perThousand} ≤ ${delayedErrorCostLimit} · ${large.receipt.action} in this simulation`,
        960,
        891,
        38,
        C.cyan,
      );
    } else if (cue.started('place') && !cue.started('cost')) {
      text(ctx, api, '800 predictions: what is the cost per 1,000?', 960, 891, 40, C.yellow);
    }
  },
);
