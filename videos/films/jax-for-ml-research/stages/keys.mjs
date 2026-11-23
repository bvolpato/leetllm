import { JAX_KEY_FIXTURE } from '../fixtures.mjs';
import { drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const words = [JAX_KEY_FIXTURE.next, JAX_KEY_FIXTURE.A];
const hex = (key) => key.map((word) => word.toString(16).padStart(8, '0')).join('  ');

export function drawKeys(ctx, scene, state, api) {
  const { C } = api;
  const opened = operationProgress(state, 'keys-open') > 0;
  const reconnect = operationProgress(state, 'keys-fork');
  const forked = reconnect > 0;
  const result = resultAfter(state, 'keys-second-mask');
  drawText(ctx, api, 'Bernoulli draw     p = ½     one bit per call', 960, 256, 40, C.ink);
  api.focus.target('key-routes', () => {
    drawText(
      ctx,
      api,
      opened ? 'seed 7   ·   split into two children' : 'Which key reached each call?',
      960,
      375,
      39,
      C.blue,
    );
    const centers = [550, 1370];
    if (opened) {
      for (const [i, x] of [760, 1180].entries()) {
        const color = i ? C.pink : C.cyan;
        api.line(ctx, 960, 397, x, 449, color, 3);
        api.circle(ctx, x, 449, 8, color);
      }
    }
    for (let i = 0; i < 2; i++) {
      const x = centers[i];
      const child = i === 1 && forked ? 1 : 0;
      const source = child ? 1180 : 760;
      const color = child ? C.pink : C.cyan;
      if (opened) {
        const length = i === 1 && forked ? reconnect : 1;
        api.line(ctx, source, 449, source + (x - source) * length, 449 + 88 * length, color, 5);
        drawText(ctx, api, 'child ' + child + '     ' + hex(words[child]), x, 610, 37, color);
      } else {
        api.line(ctx, x - 170, 548, x + 170, 548, C.muted, 3);
        drawText(ctx, api, 'key  ?', x, 610, 43, C.muted);
      }
    }
  });
  api.focus.target('key-outputs', () => {
    for (const [i, x] of [550, 1370].entries()) {
      drawText(ctx, api, 'Mask ' + (i + 1), x, 720, 34, C.muted);
      drawText(ctx, api, i === 1 && forked && !result ? '?' : 'False', x, 848, 94, C.ink);
    }
    drawText(
      ctx,
      api,
      !opened
        ? 'Do these two bits prove key reuse?'
        : forked
          ? 'Second draw uses child 1'
          : 'Both draws use child 0',
      960,
      975,
      34,
      C.yellow,
    );
  });
}
export default {
  id: 'keys',
  draw: drawKeys,
  cues: ['keys-question', 'keys-open', 'keys-fork', 'keys-second-mask'],
};
