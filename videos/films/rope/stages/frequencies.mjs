import { CLOCK_FREQUENCIES } from '../fixtures.mjs';
import { directedCue } from '../construction.mjs';
import { drawUnitPair } from '../unit-pair.mjs';

export function drawFrequencies(ctx, scene, state, api) {
  const { C, text, focus, line, circle } = api;
  const cue = (id, b) => directedCue(state, id, b);
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const turn = api.ease(cue('separate-positions', 1));
  const offset = -2 * turn;
  const scores = CLOCK_FREQUENCIES.map((f) => Math.cos(offset * f));
  const total = scores.reduce((a, b) => a + b, 0);
  const showScores = cue('read-projections', 1) > 0;
  const add = cue('sum-pairs', 2) > 0;
  const scale = cue('scale-head', 2) > 0;

  if (cue('base-schedule', 2) > 0) {
    focus.target('schedule-rule', () =>
      api.math(
        ctx,
        String.raw`\theta_i=10000^{-2i/8},\quad i=0,1,2,3`,
        960,
        270,
        42,
        C.ink,
        'center',
      ),
    );
  } else {
    label(
      'Query at 4    ·    Key moves from 4 to 2    ·    Each dial faces its own query',
      960,
      270,
      36,
      C.ink,
    );
  }
  CLOCK_FREQUENCIES.forEach((frequency, i) => {
    const x = 300 + 440 * i,
      y = 528,
      radius = 124;
    focus.target('pair-' + i, () => {
      label('(' + 2 * i + ', ' + (2 * i + 1) + ')', x, 345, 32, C.muted);
      drawUnitPair(ctx, api, {
        x,
        y,
        radius,
        queryAngle: 0,
        keyAngle: offset * frequency,
        project: turn > 0,
      });
      label(frequency + ' rad / position', x, 723, 33, C.ink);
      if (showScores) {
        line(ctx, x - 113, 789, x + 113, 789, C.muted, 2);
        line(ctx, x, 777, x, 801, C.muted, 3);
        line(ctx, x, 789, x + 113 * scores[i], 789, C.green, 6);
        circle(ctx, x + 113 * scores[i], 789, 7, C.green);
        label(scores[i].toFixed(3), x, 866, 44, C.green);
      }
    });
  });
  focus.target('head-total', () => {
    const prompt =
      state.beat === 0
        ? 'Which pair will contribute a negative dot product?'
        : showScores
          ? 'Pair dot products'
          : 'Rotating the key back two positions';
    label(
      add ? 'Head dot product  ' + total.toFixed(3) : prompt,
      scale ? 535 : 960,
      975,
      42,
      C.ink,
    );
    if (scale)
      label(
        'Logit  ' + total.toFixed(3) + ' / √8 ≈ ' + (total / Math.sqrt(8)).toFixed(3),
        1385,
        975,
        39,
        C.green,
      );
  });
}
export default {
  id: 'frequencies',
  draw: drawFrequencies,
  cues: [
    'compare-rates',
    'separate-positions',
    'read-projections',
    'sum-pairs',
    'scale-head',
    'base-schedule',
  ],
};
