import { clamp, mix, smooth } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawReference, drawText, withFocus } from '../defaults.mjs';

const jobs = [0, 2, 3];
const x = (slot) => 410 + 420 * slot;
const width = 230;

function marks(ctx, api, y) {
  jobs.forEach((_, i) => {
    const center = x(i) + width / 2;
    api.line(ctx, center, y + 89, center, y + 110, api.C.muted, 3);
  });
}

export function drawQueue(ctx, scene, state, api) {
  const { C } = api;
  const claim = q(state, 'queue-claim', 0, 0.36, 0.64);
  const shift = q(state, 'queue-list-shift', 1);
  const removal = smooth(shift / 0.18);
  const slide = smooth((shift - 0.32) / 0.68);

  withFocus(ctx, api, 'queue-array', () => {
    drawText(ctx, api, 'List', 420, 662, 38, C.ink);
    marks(ctx, api, 690);
    if (removal === 1) {
      drawText(ctx, api, 'Removed from list', 191, 662, 26, C.pink, 'center');
      api.line(ctx, 59, 785, 310, 785, C.pink, 3);
    }
    jobs.forEach((id, i) => {
      const position = i ? mix(x(i), x(i - 1), slide) : mix(x(0), 70, removal);
      drawReference(ctx, api, id, position, 690, i === 0 ? C.pink : C.blue, 1, width);
    });
    if (removal > 0 && removal < 1)
      drawText(ctx, api, 'M0 leaves the active list', 180, 872, 31, C.pink);
  });

  withFocus(ctx, api, 'queue-deque', () => {
    drawText(ctx, api, 'Deque', 160, 365, 38, C.ink);
    marks(ctx, api, 390);
    jobs.forEach((id, i) => {
      const pos = i
        ? { x: x(i), y: 390 }
        : api.pointAlongPath(
            [
              { x: x(0), y: 390 },
              { x: x(0), y: 520 },
              { x: 1500, y: 520 },
            ],
            claim,
          );
      drawReference(ctx, api, id, pos.x, pos.y, i ? C.cyan : C.yellow, 1, width);
    });
    const head = mix(x(0), x(1), clamp(claim * 2)) + width / 2;
    drawText(ctx, api, 'head', head, 341, 28, C.cyan, 'center');
    api.line(ctx, head, 351, head, 381, C.cyan, 4);
    drawText(ctx, api, 'Worker A', 1615, 477, 32, C.yellow, 'center');
    api.line(ctx, 1482, 610, 1748, 610, C.yellow, 3);
  });

  const summary =
    slide === 1
      ? 'Waiting references moved:   deque  0     /     list  2'
      : 'The marks stay where the three jobs started.';
  drawText(ctx, api, summary, 960, 981, 35, slide === 1 ? C.ink : C.muted, 'center');
}
export default {
  id: 'queue',
  draw: drawQueue,
  cues: ['queue-claim', 'queue-list-shift'],
};
