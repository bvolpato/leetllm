import { checkpoint } from '../fixtures.mjs';
import { momentumTrace, lerp } from '../arithmetic.mjs';
import { progress } from '../phrase-clock.mjs';

const gradients = [0.2, -0.5];
const trace = momentumTrace(checkpoint, gradients, 0.1, 0.9);
const x = (step) => 365 + 570 * step;

export function drawRecovery(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  const crash = p('trainer-fails');
  const forward = p('finish-eleven') + p('finish-twelve');
  const replay = p('replay-eleven') + p('replay-twelve');
  // The cursor can travel between batches. Numeric state changes only at an optimizer step.
  const head = state.beat === 0 ? lerp(forward, 0, crash) : replay;
  const done = state.beat === 0 ? (crash === 1 ? 0 : Math.floor(forward)) : Math.floor(replay);
  const pair = trace[done];
  return api.focus.target('checkpoint-track', () => {
    api.text(ctx, 'Last commit', x(0), 323, 34, C.yellow, 'center');
    api.text(ctx, 'Retained batch', x(1), 323, 34, C.blue, 'center');
    api.text(ctx, 'Retained batch', x(2), 323, 34, C.blue, 'center');
    trace.forEach((s, i) => {
      const color = i ? C.blue : C.yellow;
      api.rect(ctx, x(i) - 195, 362, 390, 154, C.panel, color, 10);
      api.text(ctx, String(s.step), x(i), 436, 55, color, 'center');
      const detail = i
        ? `gradient ${gradients[i - 1] > 0 ? '+' : '−'}${Math.abs(gradients[i - 1])}`
        : 'w = 1   /   v = 0';
      api.text(ctx, detail, x(i), 488, 30, C.ink, 'center');
    });
    api.text(ctx, 'Trainer', 111, 664, 35, C.ink);
    api.line(ctx, x(0), 648, x(2), 648, C.muted, 4);
    for (let i = 0; i < trace.length; i++) api.line(ctx, x(i), 628, x(i), 668, C.muted, 4);
    api.circle(ctx, x(head), 648, 20, crash === 1 && state.beat === 0 ? C.yellow : C.cyan);
    api.text(
      ctx,
      `Step ${pair.step}     weight ${Number(pair.weight.toFixed(4))}     velocity ${Number(pair.velocity.toFixed(4))}`,
      960,
      782,
      47,
      C.ink,
      'center',
    );
    let footer = 'Fixed gradients   /   v′ = 0.9v + g     w′ = w − 0.1v′';
    if (state.beat === 0 && crash === 1)
      footer = 'Restart at checkpoint 10. Which retained batch goes first?';
    if (state.beat === 1 && replay === 2)
      footer = 'Both retained batches are back in the trainer state.';
    if (state.beat === 2) footer = 'Next fresh batch: 13. Compare the first resumed update.';
    api.text(
      ctx,
      footer,
      960,
      947,
      40,
      state.beat === 0 && crash === 1 ? C.yellow : C.cyan,
      'center',
    );
  });
}
export default {
  id: 'recovery',
  draw: drawRecovery,
  cues: [
    'finish-eleven',
    'finish-twelve',
    'trainer-fails',
    'replay-eleven',
    'replay-twelve',
    'next-batch',
  ],
};
