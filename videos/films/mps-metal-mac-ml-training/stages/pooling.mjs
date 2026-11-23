import { ticketTexts } from '../fixtures.mjs';
import { fixed } from '../arithmetic.mjs';
import { math, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintPooling(ctx, scene, state, api, C, c, t, s) {
  target(ctx, api, 'ticket-identity', () =>
    text(ctx, api, C, 'Ticket 1 · ' + ticketTexts[0], 960, 265, 38, C.cyan, 'center'),
  );
  if (s.step === 0) {
    text(ctx, api, C, 'Encoded positions', 200, 365, 34, C.ink);
    text(ctx, api, C, '16 features', 960, 365, 34, C.ink, 'center');
    t.grid({
      x: 350,
      y: 415,
      width: 1370,
      height: 420,
      rows: 8,
      columns: 16,
      labels: Array.from(
        {
          length: 8,
        },
        () => Array(16).fill(''),
      ),
      fill: C.panel,
      stroke: C.cyan,
      highlights: [
        {
          row: Math.min(7, Math.floor(s.p * 8)),
          column: 0,
          fill: C.panel,
          stroke: C.yellow,
        },
      ],
    });
    text(ctx, api, C, '8 positions', 225, 645, 34, C.cyan, 'center');
    target(ctx, api, 'pooling-question', () =>
      text(
        ctx,
        api,
        C,
        'Average positions. Which axis disappears?',
        960,
        935,
        43,
        C.yellow,
        'center',
      ),
    );
  } else {
    const visible = s.positions;
    target(ctx, api, 'position-values', () => {
      text(ctx, api, C, 'One feature across the 8 positions', 960, 365, 35, C.ink, 'center');
      t.grid({
        x: 180,
        y: 430,
        width: 1560,
        height: 135,
        rows: 1,
        columns: 8,
        labels: [s.values.map((v) => v.toFixed(3))],
        fontSize: 39,
        textColor: C.ink,
        fill: C.panel,
        stroke: C.muted,
        highlights: Array.from(
          {
            length: visible,
          },
          (_, column) => ({
            row: 0,
            column,
            fill: C.panel,
            stroke: C.yellow,
          }),
        ),
      });
    });
    target(ctx, api, 'running-mean', () =>
      math(
        ctx,
        api,
        C,
        visible
          ? `\\bar{x}_1=\\frac{\\text{sum of ${visible} positions}}{${visible}}=${fixed(s.mean)}`
          : '\\bar{x}_1=\\;?',
        960,
        750,
        55,
        C.yellow,
      ),
    );
    if (s.shapeReady)
      target(ctx, api, 'pooled-shape', () =>
        math(
          ctx,
          api,
          C,
          '(4,8,16)\\xrightarrow{\\operatorname{mean}_{positions}}(4,16)',
          960,
          930,
          44,
          C.cyan,
        ),
      );
    else
      text(
        ctx,
        api,
        C,
        'Repeat the same average for every feature',
        960,
        930,
        32,
        C.muted,
        'center',
      );
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintPooling(ctx, scene, state, api, C, c, t, s);
}
export function drawPoolingStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'pooling',
  draw: drawPoolingStage,
  cues: ['pooling-prediction', 'average-positions', 'mean-shape'],
};
