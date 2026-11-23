import { spoken } from '../construction.mjs';
import { prompt, tile } from '../prompt.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  // A copy of the printed comma is already on its way to the input.
  const flight = Math.min(1, 0.12 + state.t / 1.2);
  const reveal = spoken(state, 'show-break', 1);
  const append = spoken(state, 'append-piece', 1);
  const rowY = 597;
  const column = (i) => 944 + 200 * i - 64 * append;
  const commaX = 570;
  const lineEnd = 638;

  api.path(
    ctx,
    [
      { x: 100, y: 238 },
      { x: 716, y: 238 },
      { x: 786, y: 308 },
      { x: 786, y: 861 },
      { x: 100, y: 861 },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: 716, y: 238 },
      { x: 716, y: 308 },
      { x: 786, y: 308 },
    ],
    { closed: true, fill: C.muted, width: 0 },
  );
  api.text(ctx, 'Shakespeare prompt', 155, 350, 33, C.bg);
  api.text(ctx, 'Good sir,', 151, 548, 112, C.bg, 'left', 'serif');
  api.text(ctx, 'Speak', 151, 704, 112, C.bg, 'left', 'serif');

  api.focus.target('prefix', () => {
    tile(ctx, api, prompt[0].piece, column(0), rowY, C.blue, 170);
    tile(ctx, api, prompt[1].piece, column(1), rowY, C.blue, 165);
    const x = commaX + (column(2) - commaX) * flight;
    const y = 450 + (rowY - 450) * flight - 165 * Math.sin(Math.PI * flight);
    api.rect(ctx, x - 56, y, 112, 110, C.panel, C.blue, 9);
    api.text(ctx, prompt[2].piece, x, y + 57, 116, C.blue, 'center', 'serif');
  });

  api.focus.target('next-piece', () => {
    const slot = column(3);
    const color = append > 0 ? C.blue : C.yellow;
    api.rect(ctx, slot - 76, rowY, 152, 110, C.panel, color, 9);
    if (reveal === 0) {
      api.text(ctx, '?', slot, rowY + 75, 55, C.yellow, 'center');
    } else {
      const x = lineEnd + (slot - lineEnd) * reveal;
      const y = 548 + (rowY + 73 - 548) * reveal - 172 * Math.sin(Math.PI * reveal);
      if (reveal < 1) api.circle(ctx, x, y - 17, 42, C.panel);
      api.text(ctx, prompt[3].piece, x, y, 62, color, 'center');
    }
    if (append > 0) tile(ctx, api, '?', column(4), rowY, C.yellow, 152);
  });

  const endOfInput = column(2) + 56 + 220 * append;
  api.line(ctx, column(0) - 85, 744, endOfInput, 744, C.blue, 3);
  api.text(ctx, 'Model input', (column(0) - 85 + endOfInput) / 2, 802, 36, C.blue, 'center');
  const nextSlot = append > 0 ? column(4) : column(3);
  api.text(ctx, 'Next token', nextSlot, 802, 36, C.yellow, 'center');
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['read-prefix', 'show-break', 'append-piece'],
};
