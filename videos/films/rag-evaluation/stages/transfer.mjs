import { completed, spoken } from '../construction.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { C, text, line } = api;
  const move = spoken(state, 'keep-receipt', 2);
  const restored = completed(state, 'keep-receipt', 2);
  const found = completed(state, 'trace-finding', 1);
  const answered = completed(state, 'answer-finding', 3);

  text(ctx, 'When will I get my return receipt?', 150, 270, 49, C.ink);
  const x = [150, 755, 1340];
  ['Library records', 'Search returned', 'In the prompt'].forEach((name, i) => {
    text(ctx, name, x[i], 392, 32, C.cyan);
    line(ctx, x[i], 417, x[i] + 435, 417, C.muted, 2);
    text(ctx, 'A   Sunday returns', x[i], 491, 38, C.ink);
  });
  api.focus.target('receipt-path', () => {
    text(ctx, 'B   Next-day email', x[0], 600, 38, C.ink);
    text(ctx, 'B   Next-day email', x[1], 600, 38, C.ink);
    if (restored) text(ctx, 'B   Next-day email', x[2], 600, 38, C.ink);
    else if (move > 0) {
      // Send a copy down the clear lane between the search result and the prompt.
      const right = 1105 + (1310 - 1105) * move;
      api.line(ctx, 1105, 587, right, 587, C.cyan, 4);
      api.circle(ctx, right, 587, 8, C.cyan);
    } else text(ctx, '—', x[2], 600, 36, C.muted);
  });
  api.focus.target('reply', () => {
    text(ctx, 'Assistant’s reply', 150, 746, 30, C.blue);
    text(ctx, '“I can’t tell from these instructions.”', 150, 822, 54, C.ink);
  });
  api.focus.target('finding', () => {
    const decision = answered
      ? 'Inspect why the answer left out the next-day instruction.'
      : restored
        ? 'The same reply. Where would you look first now?'
        : found
          ? 'Inspect the handoff from search to the prompt.'
          : 'Where did the receipt instruction disappear?';
    text(ctx, decision, 150, 971, 39, (found && !restored) || answered ? C.yellow : C.ink);
  });
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['trace-question', 'trace-finding', 'keep-receipt', 'answer-question', 'answer-finding'],
};
