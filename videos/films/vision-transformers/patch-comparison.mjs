import { visionProject } from './arithmetic.mjs';

// Keep the two columns in their image positions while one unit changes cells.
export function patchComparison(
  ctx,
  api,
  { original, edited, motion, answer, third = false, thirdAnswer = false, question },
) {
  const { C } = api;
  const from = original.findIndex((v, i) => edited[i] < v);
  const to = original.findIndex((v, i) => edited[i] > v);
  const dx = (i) => (i % 2) * 140;
  const dy = (i) => Math.floor(i / 2) * 140;
  const unitSize = 10;
  const clearance = 6;
  [155, 1035].forEach((x, side) => {
    const y = 355;
    const moving = side === 1 && motion > 0 && motion < 1;
    const values = side === 1 && motion === 1 ? edited : original;
    const edge = side === 0 ? C.cyan : C.yellow;
    const output = visionProject(values, third);
    const left = values[0] + values[2];
    const right = values[1] + values[3];
    const slot = (i, count) => [
      x + dx(i) + 110 - (Math.max(original[i], edited[i]) - count) * 14,
      y + dy(i) + 101,
    ];
    const [arrivalX, arrivalY] = slot(to, edited[to]);
    api.focus.target(side ? 'edited-patch' : 'reference-patch', () => {
      api.text(ctx, side ? 'Edited patch' : 'Reference patch', x, 301, 42, edge);
      const patchSize = 273;
      const dividerX = x + patchSize / 2;
      const dividerY = y + patchSize / 2;
      api.rect(ctx, x, y, patchSize, patchSize, C.panel, edge, 0);
      api.line(ctx, dividerX, y, dividerX, arrivalY - clearance, edge, 2);
      api.line(ctx, dividerX, arrivalY + unitSize + clearance, dividerX, y + patchSize, edge, 2);
      api.line(ctx, x, dividerY, arrivalX - clearance, dividerY, edge, 2);
      api.line(ctx, arrivalX + unitSize + clearance, dividerY, x + patchSize, dividerY, edge, 2);
      values.forEach((v, i) => {
        const cx = x + dx(i),
          cy = y + dy(i);
        api.text(ctx, v, cx + 66, cy + 76, 54, C.ink, 'center', 'mono');
        for (let unit = 1; unit <= v; unit++) {
          if (moving && i === from && unit === original[from]) continue;
          const [ux, uy] = slot(i, unit);
          api.rect(ctx, ux, uy, unitSize, unitSize, edge, undefined, 0);
        }
      });
      if (moving) {
        const [sx, sy] = slot(from, original[from]);
        api.rect(
          ctx,
          sx + (arrivalX - sx) * motion,
          sy + (arrivalY - sy) * motion,
          unitSize,
          unitSize,
          C.ink,
          undefined,
          0,
        );
      }
      api.text(ctx, 'Column sums', x, 696, 30, C.muted);
      api.text(ctx, left, x + 66, 765, 52, edge, 'center', 'mono');
      api.text(ctx, right, x + 206, 765, 52, edge, 'center', 'mono');
      const col = x + 338;
      const solved = side === 0 || answer;
      api.text(ctx, 'Mean', col, 371, 31, C.muted);
      api.text(ctx, '(' + left + ' + ' + right + ') / 4', col, 429, 39, C.ink);
      api.text(ctx, 'Right minus left, halved', col, 527, 30, C.muted);
      api.text(ctx, '(' + right + ' − ' + left + ') / 2', col, 585, 39, C.ink);
      api.text(
        ctx,
        solved ? '[' + output.slice(0, 2).join(',  ') + ']' : '[  ? ,  ?  ]',
        col,
        708,
        55,
        solved ? C.green : C.yellow,
        'left',
        'mono',
      );
      if (third) {
        api.text(ctx, 'Top left minus bottom left', x, 852, 31, C.muted);
        api.text(
          ctx,
          values[0] + ' − ' + values[2] + ' = ' + (thirdAnswer ? output[2] : '?'),
          x,
          924,
          52,
          thirdAnswer ? C.green : C.ink,
        );
      }
    });
  });
  if (question) api.text(ctx, question, 960, 962, 43, C.ink, 'center');
}
