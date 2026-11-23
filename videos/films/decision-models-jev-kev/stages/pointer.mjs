import { pointer, vectors } from '../fixtures.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';

export function drawPointer(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.cyan, C.pink];
  const ids = ['a', 'b', 'c'];
  const cues = ['foot-a', 'foot-b', 'foot-c'];
  const starts = [0.12, 0.01, 0.28];
  const origin = { x: 226, y: 750 };
  const unit = 312;
  const scaled = phraseStarted(state, 'scale-dot', 1, 0.53);
  const tips = phraseProgress(state, api, 'option-tips', 0, 0.25, 0.4);
  const query = phraseProgress(state, api, 'project-query', 0, 0.64, 0.78);
  api.text(ctx, 'Projected marker vectors', 110, 274, 37, C.muted);
  api.line(ctx, 136, origin.y, 1000, origin.y, C.muted, 2);
  api.line(ctx, origin.x, origin.y, origin.x, 345, C.muted, 2);
  [0, 1, 2].forEach((tick) => {
    const x = origin.x + unit * tick;
    api.line(ctx, x, origin.y + 6, x, origin.y + 20, C.muted, 3);
    api.text(ctx, String(tick), x, origin.y + 67, 33, C.muted, 'center');
  });
  api.text(ctx, 'Option', 1090, 274, 35, C.muted);
  api.text(ctx, 'Dot product', 1460, 274, 35, C.muted, 'center');
  api.text(ctx, 'Score', 1730, 274, 35, C.muted, 'center');
  vectors.forEach(([vx, vy], i) => {
    const x = origin.x + vx * unit;
    const y = origin.y - vy * unit;
    const name = ids[i].toUpperCase();
    const color = colors[i];
    const t = phraseProgress(state, api, cues[i], 1, starts[i], starts[i] + 0.09);
    const resultY = 440 + 157 * i;
    api.focus.target('option-vectors', () => {
      if (tips > 0)
        api.line(
          ctx,
          origin.x,
          origin.y,
          origin.x + vx * unit * tips,
          origin.y - vy * unit * tips,
          color,
          7,
        );
      if (tips === 1) {
        api.circle(ctx, x, y, 10, color);
        api.text(ctx, name + '  [' + vx + ', ' + vy + ']', x + 19, y - 26, 35, color);
      }
      api.text(ctx, name, 1120, resultY, 55, color);
    });
    api.focus.target('projection-' + ids[i], () => {
      const landingY = y + (origin.y - y) * t;
      if (t > 0) {
        if (vy) api.line(ctx, x, y, x, landingY, color, 3);
        api.circle(ctx, x, landingY, 14, C.bg, color, 4);
      }
      api.text(
        ctx,
        t === 1 ? String(vx) : '·',
        1460,
        resultY,
        58,
        t === 1 ? color : C.muted,
        'center',
      );
    });
    api.focus.target('scaled-scores', () => {
      api.text(
        ctx,
        scaled ? pointer[i].toFixed(3) : '·',
        1730,
        resultY,
        47,
        scaled ? color : C.muted,
        'center',
      );
    });
  });
  api.focus.target('decision-vector', () => {
    if (query > 0)
      api.arrow(ctx, origin.x, origin.y, origin.x + unit * query, origin.y, C.yellow, 6);
    api.text(
      ctx,
      query > 0 ? 'Decision [1, 0]' : 'Option and decision markers',
      372,
      903,
      38,
      query > 0 ? C.yellow : C.muted,
      'center',
    );
  });
  api.line(ctx, 1080, 830, 1805, 830, C.muted, 2);
  const note =
    state.beat === 0 && query > 0
      ? 'Which tip reaches furthest right?'
      : scaled
        ? 'Score = dot product / √2'
        : 'Dot product = x × 1 + y × 0';
  api.text(ctx, note, 1080, 903, 37, C.ink);
}
export default {
  id: 'pointer',
  draw: drawPointer,
  cues: ['option-tips', 'project-query', 'pointer-call', 'foot-b', 'foot-a', 'foot-c', 'scale-dot'],
};
