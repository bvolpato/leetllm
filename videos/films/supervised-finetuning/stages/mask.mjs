import { motion } from '../construction.mjs';
import { maskSnapshot } from '../model.mjs';
import { inputStrip, labelStrip, predictionArrow, tokenX } from '../token-strip.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  const v = maskSnapshot(state.beat, state.beatP, state.cues);
  const tracing = motion(state, 'trace-ticket', 1) > 0;
  const pass = motion(state, 'forward-pass', 0, 0.02, 0.18);
  const showLabels = motion(state, 'inspect-labels', 0, 0.26, 0.38) > 0;
  api.focus.target('context-trace', () => {
    inputStrip(ctx, api, { mark: tracing ? 5 : -1 });
    if (tracing) {
      api.line(ctx, tokenX(0) - 80, 490, tokenX(5), 490, C.yellow, 5);
      api.line(ctx, tokenX(0) - 80, 470, tokenX(0) - 80, 490, C.yellow, 4);
      predictionArrow(ctx, api, 6, 490, 619);
      text(ctx, api, 'Prefix available at open', 700, 553, 32, C.yellow, 'center');
    } else if (pass > 0) {
      const top = 472;
      const bottom = top + 58 * pass;
      for (let i = 0; i < v.labels.length; i++) {
        api.line(ctx, tokenX(i), top, tokenX(i), bottom, C.blue, 3);
        api.circle(ctx, tokenX(i), bottom, 6, C.blue);
      }
      if (pass === 1) api.line(ctx, tokenX(0), bottom, tokenX(7), bottom, C.blue, 3);
      text(ctx, api, 'Causal forward pass  ·  all eight positions', 960, 593, 32, C.blue, 'center');
    }
  });
  api.focus.target('token-labels', () => {
    if (!showLabels) return;
    labelStrip(ctx, api, v.labels);
    const targetText =
      state.beat >= 2
        ? '8 input positions     /     ' + v.count + ' scored reply targets'
        : tracing
          ? 'The model uses the policy and the age to predict ticket.'
          : 'Apply the response-only loss mask below the input.';
    text(ctx, api, targetText, 960, 920, 41, C.ink, 'center');
  });
}

export default {
  id: 'mask',
  draw: draw,
  cues: ['forward-pass', 'inspect-labels', 'mask-context', 'trace-ticket', 'count-targets'],
};
