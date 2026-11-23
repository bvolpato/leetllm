import { phraseProgress } from '../arithmetic.mjs';
import { rotaryPair } from '../model.mjs';
import { text } from '../defaults.mjs';

export function drawModernPositions(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat;
  const shift =
    b === 0
      ? 0
      : b === 1
        ? Math.round(10 * phraseProgress(state, 'common-rotation', 0.2, 0.55))
        : 10;
  const keyMove = b < 2 ? 0 : Math.round(3 * phraseProgress(state, 'key-only', 0.18, 0.52));
  const m = 9 + shift,
    n = 3 + shift + keyMove;
  const { query, key, score } = rotaryPair(m, n);
  const origin = { x: 540, y: 620 };
  const radius = 243;
  const point = (v) => ({ x: origin.x + radius * v[0], y: origin.y - radius * v[1] });
  api.circle(ctx, origin.x, origin.y, radius, null, C.muted, 2);
  api.line(ctx, origin.x - radius - 22, origin.y, origin.x + radius + 22, origin.y, C.muted, 1);
  api.line(ctx, origin.x, origin.y - radius - 22, origin.x, origin.y + radius + 22, C.muted, 1);
  const angleQ = Math.atan2(query[1], query[0]);
  const angleK = Math.atan2(key[1], key[0]);
  const gap = Math.atan2(Math.sin(angleK - angleQ), Math.cos(angleK - angleQ));
  const arc = Array.from({ length: 25 }, (_, i) => {
    const angle = angleQ + (gap * i) / 24;
    return { x: origin.x + 67 * Math.cos(angle), y: origin.y - 67 * Math.sin(angle) };
  });
  api.path(ctx, arc, { color: C.green, width: 4 });
  api.focus.target('rotary-arrows', () => {
    for (const [v, color] of [
      [key, C.cyan],
      [query, C.yellow],
    ]) {
      const tip = point(v);
      api.arrow(ctx, origin.x, origin.y, tip.x, tip.y, color, 6);
      api.circle(ctx, tip.x, tip.y, 7, color);
    }
  });
  text(ctx, api, 'Positions', 1040, 351, 34, C.muted);
  text(ctx, api, 'Query     ' + m, 1040, 460, 51, C.yellow);
  text(ctx, api, 'Key         ' + n, 1040, 550, 51, C.cyan);
  text(ctx, api, 'Offset    ' + (n - m), 1040, 682, 47);
  api.focus.target('rope-score', () =>
    text(ctx, api, 'Dot product    ' + score.toFixed(3), 1040, 810, 49, C.green),
  );
  text(
    ctx,
    api,
    'Fixed content vectors  ·  one coordinate pair  ·  0.1 radians per position',
    960,
    1000,
    32,
    C.muted,
    'center',
  );
}
export default {
  id: 'modern-positions',
  draw: drawModernPositions,
  cues: ['rotary-pair', 'common-rotation', 'key-only'],
};
