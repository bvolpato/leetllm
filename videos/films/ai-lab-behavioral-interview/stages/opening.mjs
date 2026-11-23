export function drawOpening(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const write = (label, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, label, x, y, size, color, 'left', font);
  const page = [
    { x: 150, y: 245 },
    { x: 592, y: 245 },
    { x: 686, y: 339 },
    { x: 686, y: 734 },
    { x: 150, y: 734 },
  ];
  api.path(ctx, page, { closed: true, fill: C.ink, width: 0 });
  api.path(ctx, [page[1], { x: 592, y: 339 }, page[2]], {
    closed: true,
    fill: C.muted,
    width: 0,
  });
  write('Returns note', 195, 411, 62, C.bg, 'serif');
  api.circle(ctx, 219, 463, 15, C.ink, C.bg, 5);
  api.rect(ctx, 197, 463, 44, 34, C.bg, undefined, 5);
  write('Reader access denied', 260, 493, 31, C.bg);
  for (const [y, end] of [
    [627, 592],
    [662, 500],
  ]) {
    api.line(ctx, 198, y, end, y, C.muted, 5);
  }

  api.rect(ctx, 1080, 281, 690, 126, C.panel, C.muted, 18);
  api.circle(ctx, 1143, 348, 18, C.panel, C.ink, 4);
  api.line(ctx, 1158, 363, 1176, 381, C.ink, 5);
  write('Reader’s search result', 1200, 370, 42, C.ink, 'serif');
  write('Snippet', 1134, 489, 34, C.muted);

  focus.target('receipt-0', () => {
    const landing = state.cues?.['snippet-returns']?.end ?? 2.8;
    const t = Math.min(1, state.t / landing);
    const x = 432 + (1130 - 432) * (1 - (1 - t) ** 2);
    api.rect(ctx, x, 521, 429, 86, C.pink, undefined, 7);
    write('“Refund pending”', x + 27, 580, 49, C.bg, 'serif');
  });
  if (focus.visible('citation-returns'))
    focus.target('receipt-1', () =>
      write('Second test: citation text returned too', 1134, 666, 31, C.pink),
    );
  write('Fictional release  •  Build B17', 150, 801, 31, C.muted);
  if (focus.visible('product-asks'))
    focus.target('proposal', () =>
      write('Product proposes a 5% canary', 1080, 801, 39, C.yellow, 'serif'),
    );

  if (focus.visible('nia-holds')) {
    focus.target('advice', () =>
      write('Nia to Priya: “Hold at 0%.”', 150, 964, 63, C.cyan, 'serif'),
    );
  } else {
    const question = focus.visible('nia-question')
      ? 'What share would you recommend to Priya?'
      : 'Would you let real users try this build?';
    focus.target('question', () => write(question, 150, 964, 63, C.ink, 'serif'));
  }
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['product-asks', 'snippet-returns', 'citation-returns', 'nia-question', 'nia-holds'],
};
