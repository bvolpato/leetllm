export function wordOdds(ctx, api, { words, p, q, y, targets, selected, targetLabel = 'Target', digits = 2 }) {
  const { C } = api;
  const pitch = 550;
  const scale = 345;
  for (const [i, word] of words.entries()) {
    const x = 165 + i * pitch;
    const paint = () => {
      api.text(ctx, word, x, y, 51, selected === i ? C.yellow : C.ink);
      for (const [row, [name, value, color]] of [
        ['Draft', q[i], C.cyan], [targetLabel, p[i], C.blue],
      ].entries()) {
        const base = y + 74 + 75 * row;
        api.text(ctx, name, x, base + 8, 30, color);
        api.rect(ctx, x + 122, base - 17, value * scale, 22, color, undefined, 3);
        api.text(ctx, value.toFixed(digits), x + 452, base + 8, 33, C.ink, 'right');
      }
    };
    if (targets) api.focus.target(targets[i], paint);
    else paint();
  }
}
