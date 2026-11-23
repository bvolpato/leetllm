import { guardCue } from '../model.mjs';

export function paintChecksByBoundary(ctx, scene, state, api) {
  const { C, text, line, circle } = api;
  const step = (id, beat) => guardCue(state, id, beat);
  const input = step('fork-input', 0);
  const generated = step('fork-output', 1);
  const review = step('fork-review', 1);
  const admission = step('fork-tool', 2);
  text(ctx, 'Payment-service deployment request', 110, 278, 42, C.ink);
  const kink = 710,
    gate = 1330;
  const x0 = 165,
    y0 = 578;

  api.focus.target('input-track', () => {
    text(ctx, 'Incoming text', x0, y0 - 51, 33, C.ink);
    line(ctx, x0, y0, kink, y0, C.panel, 6);
    line(ctx, x0, y0, x0 + (kink - x0) * input, y0, C.blue, 6);
    circle(ctx, x0 + (kink - x0) * input, y0, 12, C.blue);
    text(ctx, input === 1 ? 'Input check passed' : 'Local input check', x0, y0 + 66, 29, C.blue);
    text(ctx, 'Model', kink - 28, y0 + 70, 31, C.ink, 'right');
  });

  function branch(id, y, object, check, result, progress, passes) {
    api.focus.target(id, () => {
      line(ctx, kink, y0, kink + 155, y, C.muted, 3);
      line(ctx, kink + 155, y, 1710, y, C.panel, 7);
      const x = kink + 155 + (gate - kink - 155) * generated;
      if (generated > 0) line(ctx, kink + 155, y, x, y, C.blue, 6);
      const right = passes ? gate + (1710 - gate) * progress : gate;
      if (right > gate) line(ctx, gate, y, right, y, C.green, 6);
      line(ctx, gate, y - 20, gate, y + 20, C.yellow, 5);
      circle(ctx, generated === 1 ? right : x, y, 12, C.blue);
      text(ctx, object, kink + 156, y - 45, 33, C.ink);
      text(ctx, check, gate, y + 67, 28, C.yellow, 'center');
      if (progress === 1)
        text(ctx, result, 1630, y - 46, 32, passes ? C.green : C.yellow, 'center');
    });
  }
  if ((state.beat ?? 0) >= 1) {
    branch(
      'draft-track',
      460,
      '“I can prepare the change.”',
      'Text and evidence',
      'Sent to chat',
      review,
      true,
    );
    branch(
      'proposal-track',
      760,
      'Deploy payment-service',
      'Identity and approval',
      'No deployment',
      admission,
      false,
    );
  }
  if ((state.beat ?? 0) === 2)
    text(ctx, 'Production approval store   ·   No matching record', 960, 960, 35, C.ink, 'center');
}
export const paintChecksByBoundaryLegacy = paintChecksByBoundary;
export { paintChecksByBoundary as drawChecksByBoundary };
export default {
  id: 'checks-by-boundary',
  draw: paintChecksByBoundary,
  cues: ['fork-input', 'fork-output', 'fork-review', 'fork-tool'],
};
