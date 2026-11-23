import { lanes, policy } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { after } from '../timing.mjs';
import { text } from '../defaults.mjs';

const local = lanes.find((lane) => lane.id === 'D');
const ms = (n) => n.toLocaleString('en-US');
const zoom = (n) => 450 + (n - 2497) * 220;

export function drawTransfer(ctx, scene, state, api) {
  const { C, focus } = api;
  const { primary, endpoint, admitted, run, changed, settled, reveal } = sampleModel(
    'transfer',
    state,
  );
  const lastCase = changed && state.beat >= 2;
  const hasC = after(state, 'first-timeout', 0, 0.36);
  const hasD = after(state, 'local-duration', 0, 0.48);
  text(ctx, api, 'R900   /   pre-output timeout   /   two-attempt limit', 155, 265, 32, C.muted);
  focus.target('finish-test', () => {
    text(ctx, api, 'C timed out', 280, 376, 32, C.blue, 'center');
    text(ctx, api, 'D needs', 790, 376, 32, C.cyan, 'center');
    text(ctx, api, 'Deadline', 1450, 376, 32, C.yellow, 'center');
    text(ctx, api, hasC ? ms(primary) + ' ms' : '…', 280, 467, 58, C.blue, 'center');
    text(ctx, api, '+', 535, 465, 56, C.muted, 'center');
    text(ctx, api, hasD ? ms(local.latency) + ' ms' : '…', 790, 467, 58, C.cyan, 'center');
    text(
      ctx,
      api,
      reveal && endpoint === policy.deadline ? '=' : '<',
      1090,
      465,
      56,
      C.muted,
      'center',
    );
    text(
      ctx,
      api,
      ms(policy.deadline) + (reveal ? ' ms' : ' ms ?'),
      1450,
      467,
      58,
      C.yellow,
      'center',
    );
  });
  text(ctx, api, 'Final milliseconds', 165, 592, 30, C.muted);
  focus.target('finish-ruler', () => {
    api.line(ctx, zoom(2497), 735, zoom(2502), 735, C.muted, 3);
    for (let n = 2497; n <= 2502; n++) {
      const color = n === policy.deadline ? C.yellow : C.muted;
      api.line(
        ctx,
        zoom(n),
        n === policy.deadline ? 609 : 721,
        zoom(n),
        754,
        color,
        n === policy.deadline ? 5 : 3,
      );
      text(ctx, api, ms(n), zoom(n), 803, 31, color, 'center');
    }
    if (state.beat > 0 && (reveal || changed)) {
      const previous = 1399 + local.latency;
      if (lastCase) {
        api.line(ctx, zoom(previous), 708, zoom(previous), 735, C.green, 3);
        api.circle(ctx, zoom(previous), 708, 13, C.green);
        text(ctx, api, 'First run', zoom(previous) - 25, 660, 30, C.green, 'right');
      }
      // The dot is a finished attempt. A ring is a proposed finish.
      if (reveal) {
        const color = admitted ? C.green : C.pink;
        api.line(ctx, zoom(endpoint), 708, zoom(endpoint), 735, color, 3);
        api.circle(ctx, zoom(endpoint), 708, 16, admitted && settled ? color : C.bg, color, 5);
        text(
          ctx,
          api,
          admitted && settled ? 'D finished' : 'D would finish',
          zoom(endpoint) + (admitted ? 0 : 32),
          656,
          32,
          color,
          admitted ? 'center' : 'left',
        );
      }
    }
  });
  const question = 'Would you send D?';
  let outcome = question;
  if (settled) {
    outcome = admitted
      ? `Send D   ·   ${ms(run.elapsed)} ms   ·   ${run.spans.length} attempts`
      : `Escalate at ${ms(run.elapsed)} ms   ·   ${run.spans.length} attempt`;
  }
  focus.target('dispatch-result', () =>
    text(
      ctx,
      api,
      outcome,
      960,
      940,
      49,
      settled ? (admitted ? C.green : C.pink) : C.yellow,
      'center',
    ),
  );
  if (lastCase && settled)
    text(ctx, api, 'GR-27   ·   Viewer access granted once', 960, 1018, 32, C.ink, 'center');
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'first-timeout',
    'local-duration',
    'first-sum',
    'first-dispatch',
    'transfer-change',
    'second-sum',
    'second-dispatch',
  ],
};
