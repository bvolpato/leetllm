import { directedCue } from '../construction.mjs';
import { cachePositionFrame } from '../model.mjs';
import { drawScoreRuler, drawUnitPair } from '../unit-pair.mjs';

export function drawEvaluation(ctx, scene, state, api) {
  const { C, text, focus } = api;
  const cue = (id, b) => directedCue(state, id, b);
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const stale = cue('try-old-key', 1) > 0 && cue('rebuild-key', 2) === 0;
  const known = cue('try-old-key', 1) > 0;
  const reference = cachePositionFrame(1);
  const trial = cachePositionFrame(1, stale ? 1 : 0);
  const m = reference.queryPosition,
    n = reference.keyPosition;
  label('cats  ·  key at ' + n, 460, 274, 40, C.yellow);
  label('dogs  ·  query at ' + m, 1430, 274, 40, C.cyan);
  label('Full pass', 490, 383, 40, C.ink);
  label('Cache builder', 1410, 383, 40, C.ink);
  const y = 596,
    r = 154;
  focus.target('reference-key', () => {
    drawUnitPair(ctx, api, { x: 490, y, radius: r, queryAngle: m * 0.5, keyAngle: n * 0.5 });
    label('K rotated at ' + n, 490, 819, 35, C.yellow);
    label('Dot product  ' + reference.score.toFixed(3), 490, 928, 46, C.green);
  });
  focus.target('cached-key', () => {
    if (known) {
      drawUnitPair(ctx, api, {
        x: 1410,
        y,
        radius: r,
        queryAngle: m * 0.5,
        keyAngle: trial.keyPhasePosition * 0.5,
      });
      label('K rotated at ' + trial.keyPhasePosition, 1410, 819, 35, stale ? C.red : C.yellow);
    } else {
      api.circle(ctx, 1410, y, r, 'transparent', C.muted, 2);
      label('?', 1410, y + 27, 72, C.ink);
      label('Reuse the key rotated at 3?', 1410, 819, 35, C.yellow);
    }
  });
  focus.target('cache-score', () => {
    drawScoreRuler(ctx, api, 1150, 918, 520, known ? trial.score : undefined, reference.score);
    label(
      known ? 'Dot product  ' + trial.score.toFixed(3) : 'Dot product  ?',
      1410,
      881,
      35,
      known ? C.green : C.muted,
    );
  });
  if (known)
    label(
      '(' +
        trial.keyPhasePosition +
        ' - ' +
        m +
        ') × 0.5 = ' +
        trial.relativePhase.toFixed(0) +
        ' rad',
      960,
      1020,
      32,
      C.pink,
    );
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: ['old-copy-question', 'try-old-key', 'inspect-old-score', 'rebuild-key'],
};
