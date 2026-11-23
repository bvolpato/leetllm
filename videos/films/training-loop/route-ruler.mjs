import { text } from './defaults.mjs';

export function scoreTicket(weights, ticket) {
  const logits = weights.map((row) =>
    row.reduce((sum, weight, index) => sum + weight * ticket[index], 0),
  );
  return { logits, gap: logits[1] - logits[0] };
}

export function signed(value) {
  if (value === 0) return '0';
  return (value < 0 ? '−' : '+') + Math.abs(value).toFixed(2);
}

export function ticketStrip(ctx, api, name, features) {
  const { C } = api;
  text(ctx, api, name, 150, 250, 39, C.ink);
  text(ctx, api, 'Urgency  ' + features[0], 665, 250, 34, C.blue);
  text(ctx, api, 'Severity  ' + features[1], 1040, 250, 34, C.blue);
  text(ctx, api, 'Label  escalate', 1770, 250, 34, C.muted, 'right');
  api.line(ctx, 150, 280, 1770, 280, C.muted, 2);
}

// Positive and negative gaps use the same fixed scale in both ticket scenes.
export function routeRuler(ctx, api, y, marks) {
  const { C } = api;
  const position = (value) => 960 + value * 1140;
  api.focus.target('route-ruler', () => {
    text(ctx, api, 'Escalation score − standard score', 960, y - 124, 36, C.ink, 'center');
    api.line(ctx, position(-0.6), y, position(0), y, C.blue, 7);
    api.line(ctx, position(0), y, position(0.6), y, C.green, 7);
    for (let tick = -6; tick <= 6; tick++) {
      const x = position(tick / 10);
      api.line(ctx, x, y + 6, x, y + (tick % 2 === 0 ? 22 : 13), C.muted, 2);
      if (tick % 2 === 0) text(ctx, api, signed(tick / 10), x, y + 55, 28, C.muted, 'center');
    }
    text(ctx, api, 'Standard queue', position(-0.36), y + 107, 36, C.blue, 'center');
    text(ctx, api, 'Tie → standard', position(0), y + 107, 27, C.muted, 'center');
    text(ctx, api, 'Specialist escalation', position(0.36), y + 107, 36, C.green, 'center');
    for (const { gap, label, color, hollow } of marks) {
      const x = position(gap);
      api.line(ctx, x, y - 33, x, y - 11, color, 3);
      api.circle(ctx, x, y, 12, hollow ? C.bg : color, color, 3);
      text(ctx, api, label, x, y - 49, 34, color, 'center');
    }
  });
}
