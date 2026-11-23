import { choices } from './ticket.mjs';

export const rowY = (i) => 412 + 168 * i;

export function drawScoreOptions(ctx, api) {
  api.text(ctx, 'RUN-842   /   answer', 110, 285, 35, api.C.muted);
  choices.slice(0, 3).forEach((description, i) => {
    const y = rowY(i);
    api.focus.target(i === 1 ? 'target-share' : 'option-label', () => {
      api.text(ctx, String.fromCharCode(65 + i), 108, y, 47, api.C.ink);
      api.text(ctx, description, 176, y, 42, api.C.ink);
      if (i === 1) api.text(ctx, 'Reviewed answer', 178, y + 45, 29, api.C.cyan);
    });
  });
}

export function shareBar(
  ctx,
  api,
  x,
  y,
  width,
  value,
  { original, visible = 1, color = api.C.blue } = {},
) {
  api.line(ctx, x, y, x + width, y, api.C.muted, 2);
  if (value * visible > 0)
    api.rect(ctx, x, y - 20, width * value * visible, 20, color, undefined, 1);
  if (original !== undefined) {
    const marker = x + original * width;
    api.line(ctx, marker, y + 5, marker, y + 22, api.C.yellow, 4);
  }
}
