import { line, text } from '../defaults.mjs';
import { canary, delayedCostCohort } from '../fixtures.mjs';
import { simulateRelease } from '../model.mjs';
import { costRuler, errorTiles, releaseWindow } from '../release-cost.mjs';
import { monitoringScene } from '../storyboard.mjs';

const example = releaseWindow(
  delayedCostCohort.rows,
  delayedCostCohort.rows,
  delayedCostCohort.falseAlerts,
  delayedCostCohort.missedDeadlines,
);

export default monitoringScene(
  'rollback-conditions',
  [
    'failed',
    'late',
    'hold',
    'empty',
    'invalid',
    'boundary',
    'strict',
    'window',
    'alerts',
    'weights',
    'eighty',
    'return-result',
    'verify',
    'old',
  ],
  (ctx, api, cue) => {
    const { C } = api;
    const costKnown = cue.done('eighty');
    if (!cue.started('window') && !costKnown) {
      const post = cue.started('late');
      text(
        ctx,
        api,
        post ? 'After promotion   /   v4 is active' : 'Before promotion   /   v3 is active',
        150,
        290,
        44,
        C.blue,
        'left',
      );
      const boundary = cue.started('boundary');
      const empty = cue.started('empty');
      const healthy = 0.85 <= canary.queueLimit;
      const result = post
        ? simulateRelease({ mature: 500, joined: empty ? 500 : 499, cost: boundary ? 50 : null })
        : simulateRelease({ healthy });
      const inputs = !post
        ? [
            ['Canary requests', '600  ≥  500'],
            ['Error rate', '0.004  ≤  0.005'],
            ['p95 response', '49 ms  ≤  50 ms'],
            ['Review queue load', '0.85  >  0.80'],
          ]
        : [
            ['Mature predictions', '500'],
            ['Labels joined', empty ? '500' : '499'],
            ['Cost per 1,000', boundary ? '50' : empty ? 'Missing' : 'Await label'],
            ['Rollback rule', 'Above 50'],
          ];
      inputs.forEach(([name, value], i) => {
        const y = 410 + i * 96;
        text(ctx, api, name, 205, y, 35, C.muted, 'left');
        text(ctx, api, value, 760, y, 37, C.ink);
      });
      line(ctx, api, 1070, 357, 1070, 775, C.muted, 2);
      text(ctx, api, 'Simulator returns', 1450, 430, 32, C.muted);
      const ready = boundary
        ? cue.done('strict')
        : empty
          ? cue.done('invalid')
          : post
            ? cue.done('hold')
            : cue.done('failed');
      if (ready) {
        text(ctx, api, result.action, 1450, 547, 40, C.yellow);
        text(ctx, api, `Alias  ${result.alias}`, 1450, 650, 36, C.blue);
      }
      return;
    }
    const n = example.mature;
    text(
      ctx,
      api,
      `Later v4 cohort   /   ${n} mature   /   ${example.joined} labels`,
      155,
      250,
      38,
      C.blue,
      'left',
    );
    errorTiles(
      ctx,
      api,
      example,
      costKnown ? 1 : cue.progress('alerts'),
      costKnown ? 1 : cue.progress('weights'),
    );
    if (cue.done('weights') || costKnown) {
      text(
        ctx,
        api,
        `Raw error cost   ${2 * example.fp} + ${10 * example.fn} = ${example.raw}`,
        450,
        527,
        35,
        C.ink,
      );
      text(
        ctx,
        api,
        cue.done('eighty')
          ? `(2×${example.fp} + 10×${example.fn}) / ${n} × 1,000 = ${example.perThousand}`
          : `${example.raw} × 1,000 / ${n} = ?`,
        1320,
        527,
        35,
        C.ink,
      );
    }
    costRuler(ctx, api, [
      {
        n,
        value: cue.started('eighty') ? example.perThousand : null,
        progress: cue.progress('eighty'),
        label: cue.done('eighty'),
        color: C.pink,
      },
    ]);
    if (cue.done('return-result')) {
      text(ctx, api, example.receipt.action, 610, 839, 40, C.yellow);
      text(ctx, api, `Proposed alias   ${example.receipt.alias}`, 1320, 839, 38, C.blue);
    }
    if (cue.started('old'))
      text(
        ctx,
        api,
        'v3 offline: 60 per 1,000   /   v3 after restoring traffic: ?',
        960,
        934,
        34,
        C.ink,
      );
    else if (cue.started('verify'))
      text(
        ctx,
        api,
        'Check compatibility, the active alias and which bundle receives new requests.',
        960,
        934,
        31,
        C.ink,
      );
  },
);
