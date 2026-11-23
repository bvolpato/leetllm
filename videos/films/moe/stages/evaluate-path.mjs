import { spokenProgress } from '../construction.mjs';
import { rect, text } from '../defaults.mjs';

const positions = 4;
const experts = ['E1', 'E3'];

function step(ctx, api, x, y, width, rows, colors, grouped) {
  const { C } = api;
  rect(ctx, api, x, y, width, 190, C.panel, C.muted, 12);
  experts.forEach((expert, e) => {
    const ey = y + 37 + 75 * e;
    text(ctx, api, expert, x + 25, ey + 30, 32, C.ink, 'left', 'mono');
    rows.forEach((t, r) => {
      const tx = x + 105 + r * 87;
      rect(ctx, api, tx, ey - 7, 68, 53, colors[t], undefined, 6);
      text(ctx, api, 't' + t, tx + 34, ey + 29, 28, C.bg, 'center', 'mono');
    });
    if (grouped && rows.length > 1) {
      const end = x + 105 + 87 * (rows.length - 1) + 68;
      api.line(ctx, x + 106, ey + 54, end, ey + 54, C.cyan, 3);
    }
  });
}

export function drawEvaluatePath(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.cyan, C.pink, C.yellow, C.green];
  const decode = spokenProgress(api, state, 'serial-steps', 0);
  const prefill = spokenProgress(api, state, 'prefill-group', 1);
  const showCount = spokenProgress(api, state, 'equal-work', 2, 0.1, 0.5) === 1;
  text(
    ctx,
    api,
    'Illustrative routes  ·  four positions, each assigned to E1 and E3',
    118,
    235,
    37,
    C.ink,
  );
  api.focus.target('decode-steps', () => {
    text(ctx, api, 'Decode', 118, 377, 43, C.ink);
    text(ctx, api, 'one request', 118, 430, 30, C.muted);
    for (let t = 0; t < positions; t++) {
      const x = 470 + t * 313;
      const rows = t === 0 || decode * (positions - 1) >= t ? [t] : [];
      step(ctx, api, x, 315, 215, rows, colors, false);
      if (t < positions - 1) api.arrow(ctx, x + 228, 411, x + 293, 411, C.muted, 4);
      text(ctx, api, 'step ' + (t + 1), x + 104, 555, 30, C.muted, 'center');
    }
  });
  if ((state.beat ?? 0) >= 1) {
    api.focus.target('prefill-step', () => {
      text(ctx, api, 'Prefill', 118, 706, 43, C.ink);
      text(ctx, api, 'one prompt', 118, 759, 30, C.muted);
      const rows = Array.from(
        { length: Math.min(positions, Math.ceil(positions * prefill)) },
        (_, i) => i,
      );
      step(ctx, api, 470, 644, 500, rows, colors, true);
      text(ctx, api, 'one routing group', 720, 890, 30, C.muted, 'center');
      if (showCount) {
        text(
          ctx,
          api,
          positions * experts.length + ' expert rows in each example',
          1054,
          719,
          42,
          C.cyan,
        );
        text(ctx, api, positions + ' rows per prefill expert call', 1054, 793, 33, C.ink);
      }
    });
  }
  if (showCount)
    text(
      ctx,
      api,
      'Measure dispatch, expert work and combine on the target hardware.',
      960,
      994,
      37,
      C.ink,
      'center',
    );
}

export default {
  id: 'evaluate-path',
  draw: drawEvaluatePath,
  cues: ['serial-steps', 'prefill-group', 'equal-work'],
};
