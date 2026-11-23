import { developmentBootstrap, taskRows } from '../fixtures.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { mark, text } from '../defaults.mjs';
import { drawLiftRange, drawLiftRuler, liftVerdict, minimumLift } from '../lift-ruler.mjs';

const estimate = taskRows.reduce((total, row) => total + row.difference, 0) / taskRows.length;

export function drawUsefulLift(ctx, scene, state, api) {
  const C = api.C;
  mark(api, 'useful-threshold', () => drawLiftRuler(ctx, api));
  mark(api, 'development-range', () =>
    drawLiftRange(ctx, api, {
      name: 'Development   ·   40 tasks',
      y: 482,
      color: C.blue,
      interval: developmentBootstrap.interval,
      estimate,
      progress: cueProgress(state, 'development-range', 0),
      highlightLower: resultOrOperation(state, 'useful-question', 0),
    }),
  );
  if (resultOrOperation(state, 'useful-question', 0) && !resultOrOperation(state, 'useful-hold', 1))
    mark(api, 'decision-question', () =>
      text(
        ctx,
        api,
        `Does the lower end clear +${minimumLift * 100} percentage points?`,
        960,
        677,
        46,
        C.yellow,
        'center',
      ),
    );
  if (resultOrOperation(state, 'useful-hold', 1))
    mark(api, 'development-receipt', () =>
      text(ctx, api, liftVerdict(developmentBootstrap.interval), 960, 677, 43, C.ink, 'center'),
    );
  if (resultOrOperation(state, 'freeze-protocol', 1))
    mark(api, 'frozen-protocol', () =>
      text(
        ctx,
        api,
        'Holdout plan   ·   Same tasks for A and B   ·   One attempt each',
        960,
        997,
        30,
        C.cyan,
        'center',
      ),
    );
}

export default {
  id: 'useful-lift',
  draw: drawUsefulLift,
  cues: [
    'useful-threshold',
    'development-range',
    'useful-question',
    'useful-hold',
    'freeze-protocol',
  ],
};
