export function massLedger(ctx, api, { words, target, overlap, loose, added, settled, legend,
  emphasis }) {
  const { C } = api;
  const x = 420, scale = 1660;
  if (Array.isArray(legend)) {
    for (const [i, label] of legend.entries()) {
      const left = 145 + i * 355;
      api.rect(ctx, left, 225, 35, 25, label.color, undefined, 1);
      api.text(ctx, label.text, left + 51, 251, 32, C.ink);
    }
  } else {
    api.text(ctx, legend, 145, 251, 34, C.ink);
  }
  api.text(ctx, 'One division = 0.10', 1760, 251, 29, C.muted, 'right');
  for (const [i, word] of words.entries()) {
    const y = 391 + 189 * i;
    const edge = x + target[i] * scale;
    api.text(ctx, word, 146, y + 46, 51, C.ink);
    api.rect(ctx, x, y, target[i] * scale, 54, C.panel, C.blue, 2);
    const sections = [
      [overlap[i], C.cyan],
      [added[i], C.yellow],
      [loose[i], C.pink],
    ];
    let left = x;
    for (const [amount, color] of sections) {
      const width = amount * scale;
      if (width > 0.001) api.rect(ctx, left, y + 3, width, 48, color, undefined, 1);
      left += width;
    }
    for (let tick = 0; tick <= 6; tick++)
      api.line(ctx, x + tick / 10 * scale, y + 63, x + tick / 10 * scale, y + 77, C.muted, 2);
    api.line(ctx, edge, y - 11, edge, y + 59, C.blue, 4);
    api.text(ctx, 'Target ' + target[i].toFixed(2), edge, y - 26, 29, C.blue, 'center');
    const mass = overlap[i] + added[i];
    const kind = settled ? 'Emitted mass ' : added.some((v) => v > 0) ? 'Accounted mass ' : 'Accepted mass ';
    api.text(ctx, kind + mass.toFixed(2), 1770, y + 41, 31, emphasis === i ? C.yellow : C.ink, 'right');
  }
}
