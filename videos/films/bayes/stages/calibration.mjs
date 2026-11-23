import { event } from '../construction.mjs';
import { calibrationFrame } from '../model.mjs';
import { caption, target, text } from '../defaults.mjs';
import { percent } from '../release-scale.mjs';

function drawRetryLog(ctx, state, api) {
  const { C } = api;
  const grouped = Math.floor(4 * event(state, 1, 'group-validation-retries', 0.29, 0.54) + 1e-9);
  target(ctx, api, 'retry-log', () => {
    text(ctx, api, 'A different evaluation log', 155, 291, 38, C.ink);
    for (let prompt = 0; prompt < 4; prompt++) {
      const x = 155 + 255 * prompt;
      const name = 'ABCD'[prompt];
      const color = prompt < grouped ? C.blue : C.muted;
      for (let attempt = 0; attempt < 5; attempt++) {
        api.components.card({
          x: x + 12,
          y: 365 + 88 * attempt,
          width: 195,
          height: 64,
          label: name + '  /  try ' + (attempt + 1),
          fill: C.panel,
          stroke: C.muted,
          textColor: C.ink,
          fontSize: 28,
        });
      }
      if (prompt < grouped) {
        api.line(ctx, x, 355, x, 795, color, 4);
        api.line(ctx, x, 355, x + 22, 355, color, 4);
        api.line(ctx, x, 795, x + 22, 795, color, 4);
        text(ctx, api, 'Prompt ' + name, x + 98, 866, 32, color, 'center');
      }
    }
  });
  target(ctx, api, 'distinct-prompts', () => {
    text(ctx, api, '20 recorded attempts', 1490, 456, 43, C.ink, 'center');
    if (grouped === 4) {
      text(ctx, api, '4', 1490, 659, 95, C.blue, 'center');
      text(ctx, api, 'distinct prompts', 1490, 729, 38, C.blue, 'center');
    } else text(ctx, api, 'How many different prompts?', 1490, 662, 31, C.muted, 'center');
  });
  caption(ctx, api, 'Each letter identifies the underlying prompt across attempts.');
}

export function drawCalibration(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 1 && event(state, 1, 'open-retry-log', 0.22, 0.31) > 0)
    return target(ctx, api, 'sample-source', () => drawRetryLog(ctx, state, api));
  const v = calibrationFrame(state);
  const saved = event(state, 0, 'save-validation-forecasts', 0.05, 0.38);
  const q = api.teaching.axes({
    x: 165,
    y: 355,
    width: 1130,
    height: 465,
    xDomain: [0, 100],
    yDomain: [0, 1],
    xTicks: [0, 25, 50, 75, 100],
    yTicks: [0, 0.5, 1],
    xLabel: 'fresh validation tasks observed',
    yLabel: 'pass probability or fraction',
    fontSize: 28,
  });
  target(ctx, api, 'saved-forecasts', () => {
    text(ctx, api, 'Saved forecast', 1400, 370, 34, C.blue);
    if (saved > 0) {
      api.teaching.curve({
        plot: q,
        points: [
          { x: 0, y: v.forecast },
          { x: 100 * saved, y: v.forecast },
        ],
        color: C.blue,
        width: 5,
      });
      text(ctx, api, percent(v.forecast), 1400, 465, 56, C.blue);
    }
  });
  target(ctx, api, 'validation-results', () => {
    text(ctx, api, 'Fresh outcomes', 1400, 605, 34, C.green);
    if (v.points.length > 1)
      api.teaching.curve({ plot: q, points: v.points, color: C.green, width: 5 });
    if (v.processed) {
      const tip = v.points.at(-1),
        at = q.point(tip.x, tip.y);
      api.circle(ctx, at.x, at.y, 8, C.green);
      text(ctx, api, v.passes + ' / ' + v.processed, 1400, 700, 52, C.green);
    } else text(ctx, api, 'Still sealed', 1400, 695, 34, C.muted);
  });
  caption(ctx, api, 'One frozen forecast for a fresh, hypothetical batch of 100 comparable tasks.');
}

export default {
  id: 'calibration',
  draw: drawCalibration,
  cues: [
    'save-validation-forecasts',
    'reveal-validation-outcomes',
    'open-retry-log',
    'group-validation-retries',
  ],
};
