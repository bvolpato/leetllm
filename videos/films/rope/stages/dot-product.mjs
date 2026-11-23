import { directedCue } from '../construction.mjs';
import { drawScoreRuler, drawUnitPair } from '../unit-pair.mjs';

export function drawDotProduct(ctx, scene, state, api) {
  const { C, text, focus } = api;
  const cue = (id, b) => directedCue(state, id, b);
  const label = (value, x, y, size, color) => text(ctx, value, x, y, size, color, 'center');
  const demo = state.beat === 0;
  const turn = api.ease(cue('position-the-pair', 1));
  const q = demo ? 0 : 5 * 0.5 * turn;
  const alignmentAngle = (Math.PI / 2) * (cue('quarter-turn', 0) + cue('half-turn', 0));
  // Return the demonstration key to its starting direction before applying the position rotations.
  const reset = cue('reset-key', 1);
  const keyAngle = demo ? alignmentAngle : (1 - reset) * Math.PI + 3 * 0.5 * turn;
  const score = Math.cos(keyAngle - q);
  label('Unit query', 360, 300, 37, C.cyan);
  label('Unit key', 650, 300, 37, C.yellow);
  focus.target('alignment', () =>
    drawUnitPair(ctx, api, { x: 510, y: 600, radius: 230, queryAngle: q, keyAngle }),
  );
  label('Projection onto the query', 1340, 390, 40, C.ink);
  focus.target('projection-score', () => {
    drawScoreRuler(ctx, api, 990, 580, 700, score);
    label((Math.abs(score) < 0.0005 ? 0 : score).toFixed(3), 1340, 760, 63, C.green);
  });
  if (!demo) {
    label('Q at 5    K at 3    ·    0.5 rad per position', 960, 904, 37, C.ink);
    if (state.beat >= 2)
      label(
        '(3 - 5) × 0.5 = -1 rad      cos(-1) ≈ ' + Math.cos(-1).toFixed(3),
        960,
        990,
        35,
        C.green,
      );
  }
}
export default {
  id: 'dot-product',
  draw: drawDotProduct,
  cues: ['quarter-turn', 'half-turn', 'reset-key', 'position-the-pair', 'read-projection'],
};
