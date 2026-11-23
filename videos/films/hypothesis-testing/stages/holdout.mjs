import { developmentBootstrap, holdoutBootstrap, holdoutRows, taskRows } from '../fixtures.mjs';
import { holdoutFrame } from '../construction.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { mark, text } from '../defaults.mjs';
import { drawLiftRange, drawLiftRuler, liftVerdict } from '../lift-ruler.mjs';

const bWins = holdoutRows.filter((row) => row.difference > 0).length;
const aWins = holdoutRows.filter((row) => row.difference < 0).length;
const ties = holdoutRows.length - bWins - aWins;
const lift = (bWins - aWins) / holdoutRows.length;
const developmentLift = taskRows.reduce((sum, row) => sum + row.difference, 0) / taskRows.length;

export function drawHoldout(ctx, scene, state, api) {
  const C = api.C;
  const f = holdoutFrame(state);
  if (!state.beat) {
    mark(api, 'holdout-rows', () => {
      text(ctx, api, 'Illustrative holdout   ·   One attempt each', 220, 318, 41, C.ink);
      for (const [i, row] of holdoutRows.entries()) {
        const tone = row.difference === 1 ? C.green : row.difference === -1 ? C.pink : C.muted;
        api.rect(
          ctx,
          230 + (i % 40) * 37,
          377 + Math.floor(i / 40) * 32,
          24,
          21,
          i < f.count ? tone : C.panel,
        );
      }
      text(
        ctx,
        api,
        `${f.count} of ${holdoutRows.length} paired tasks`,
        960,
        774,
        35,
        C.ink,
        'center',
      );
    });
    mark(api, 'holdout-counts', () => {
      for (const [i, [value, name, tone]] of [
        [bWins, 'B only', C.green],
        [aWins, 'A only', C.pink],
        [ties, 'Ties', C.muted],
      ].entries())
        text(
          ctx,
          api,
          f.counts ? `${name}   ${value}` : name,
          492 + i * 470,
          911,
          39,
          tone,
          'center',
        );
    });
    return;
  }

  mark(api, 'holdout-ruler', () => drawLiftRuler(ctx, api, true));
  drawLiftRange(ctx, api, {
    name: 'Development   ·   40 tasks',
    y: 460,
    color: C.blue,
    interval: developmentBootstrap.interval,
    estimate: developmentLift,
  });
  mark(api, 'holdout-interval', () =>
    drawLiftRange(ctx, api, {
      name: 'Fresh holdout   ·   400 tasks',
      y: 662,
      color: C.cyan,
      interval: holdoutBootstrap.interval,
      estimate: f.lift ? lift : undefined,
      progress: f.interval,
      highlightLower: resultOrOperation(state, 'holdout-lower', 1),
      clearance: cueProgress(state, 'holdout-clearance', 2),
    }),
  );
  if (state.beat === 1 && !resultOrOperation(state, 'holdout-predict', 1)) {
    mark(api, 'holdout-lift', () =>
      text(
        ctx,
        api,
        f.lift
          ? `(${bWins} − ${aWins}) / ${holdoutRows.length}   =   +${lift * 100} percentage points`
          : `(${bWins} − ${aWins}) / ${holdoutRows.length}`,
        960,
        1000,
        37,
        C.cyan,
        'center',
      ),
    );
  } else if (state.beat === 1) {
    mark(api, 'holdout-question', () =>
      text(ctx, api, 'On the fresh tasks, would you switch or hold?', 960, 1000, 38, C.ink, 'center'),
    );
  } else if (f.release) {
    mark(api, 'release-receipt', () =>
      text(ctx, api, liftVerdict(holdoutBootstrap.interval), 960, 1000, 42, C.green, 'center'),
    );
  }
}

export default {
  id: 'holdout',
  draw: drawHoldout,
  cues: [
    'holdout-rows',
    'holdout-count',
    'holdout-lift',
    'holdout-interval',
    'holdout-lower',
    'holdout-predict',
    'holdout-clearance',
    'release-receipt',
  ],
};
