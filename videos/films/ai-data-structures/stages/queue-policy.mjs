import { clamp, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

export function drawQueuePolicy(ctx, scene, state, api) {
  const { C } = api;
  const append = q(state, 'ds-queue-policy-0', 1);
  const attempt = q(state, 'ds-queue-policy-1', 1, 0.6, 0.95);
  const claim = q(state, 'queue-policy-claim', 3);
  const empty = q(state, 'queue-policy-empty', 3, 0.63, 0.94);
  const seat = (id, x, y, color) => drawCard(ctx, api, 'M' + id, x, y, 154, 67, color, 1, 34);
  withFocus(ctx, api, 'ds-queue-policy-mechanism', () => {
    drawText(ctx, api, 'Producer', 250, 316, 32, C.ink, 'center');
    drawText(ctx, api, 'Oldest', 775, 316, 32, C.muted, 'center');
    drawText(ctx, api, 'Newest', 1095, 316, 32, C.muted, 'center');
    const tray = (y) => {
      for (const x of [665, 985]) api.rect(ctx, x, y - 17, 220, 103, C.panel, C.muted, 10);
    };

    drawText(ctx, api, 'deque(maxlen=2)', 158, 405, 30, C.cyan, 'left', 'mono');
    tray(454);
    const eject = clamp(append * 2);
    const shift = clamp(append * 2 - 0.7);
    const incoming = clamp(append * 2 - 1);
    seat(0, mix(698, 454, eject), 454 - 84 * eject, eject > 0 ? C.pink : C.cyan);
    seat(2, mix(1018, 698, shift), 454, C.cyan);
    // Take the arriving slip below the occupied slots until the far slot clears.
    const inPos = api.pointAlongPath(
      [
        { x: 173, y: 454 },
        { x: 173, y: 558 },
        { x: 1018, y: 558 },
        { x: 1018, y: 454 },
      ],
      incoming,
    );
    seat(3, inPos.x, inPos.y, C.yellow);
    if (append === 1) drawText(ctx, api, 'Dropped', 531, 493, 29, C.pink, 'center');

    drawText(ctx, api, 'Queue(maxsize=2)', 158, 702, 30, C.cyan, 'left', 'mono');
    tray(750);
    const bounced = Math.sin(Math.PI * attempt);
    seat(3, 173 + 320 * bounced, 750, C.yellow);
    if (attempt > 0 && claim === 0) api.line(ctx, 650, 738, 650, 826, C.pink, 6);
    if (attempt === 1)
      drawText(ctx, api, 'put_nowait(M3) raised queue.Full', 130, 885, 29, C.pink, 'left', 'mono');
    const first = clamp(2 * claim);
    const second = clamp(2 * claim - 1);
    // Separate paths keep the pending M2 visible while M0 is claimed.
    seat(0, mix(698, 1330, first), 750 - Math.sin(Math.PI * first) * 110, C.cyan);
    seat(2, mix(1018, 1608, second), 750 - 113 * Math.sin(Math.PI * second), C.cyan);
    if (first === 1) drawText(ctx, api, 'Worker A', 1407, 883, 27, C.ink, 'center');
    if (second === 1) drawText(ctx, api, 'Worker B', 1685, 883, 27, C.ink, 'center');
    if (empty === 1)
      drawText(ctx, api, 'get_nowait() raised queue.Empty', 960, 953, 33, C.ink, 'center', 'mono');
  });
}

export default {
  id: 'queue-policy',
  draw: drawQueuePolicy,
  cues: ['ds-queue-policy-0', 'ds-queue-policy-1', 'queue-policy-claim', 'queue-policy-empty'],
};
