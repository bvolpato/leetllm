import { drawSqlText } from './defaults.mjs';

export const coat = { age: 18, julyWindow: 14, earlierWindow: 30 };

function drawPurchaseAge(ctx, api, { showAge, windows, settled }) {
  const { C } = api;
  const x = (day) => 180 + 21 * day;
  const y = 930;
  api.focus.target('purchase-age', () => {
    api.line(ctx, x(0), y, x(32), y, C.muted, 2);
    drawSqlText(ctx, api, '0', x(0), y + 38, 25, C.muted, 'center');
    for (const day of windows) {
      api.line(ctx, x(day), y - 6, x(day), y + 11, C.cyan, 4);
      drawSqlText(ctx, api, String(day), x(day), y + 38, 27, C.cyan, 'center');
    }
    if (showAge) {
      api.circle(ctx, x(coat.age), y, 7, C.yellow);
      drawSqlText(ctx, api, 'Day ' + coat.age, x(coat.age), y - 20, 27, C.yellow, 'center');
    }
    if (settled) {
      api.line(ctx, x(coat.julyWindow), y, x(coat.age), y, C.yellow, 5);
      drawSqlText(
        ctx,
        api,
        coat.age - coat.julyWindow + ' days past the deadline',
        885,
        875,
        26,
        C.yellow,
        'right',
      );
    }
  });
}

export function drawReturnSlip(ctx, api, { date, left, right }) {
  const { C } = api;
  api.rect(ctx, 115, 754, 1690, 236, C.panel, C.muted, 2, 8);
  drawSqlText(ctx, api, 'Harbor  /  Returns desk', 155, 807, 33, C.ink);
  drawSqlText(ctx, api, 'Bob   ·   ' + date, 1760, 806, 30, C.ink, 'right');
  api.line(ctx, 155, 829, 1765, 829, C.muted, 2);
  for (const [index, field] of [left, right].entries()) {
    const x = 155 + index * 835;
    drawSqlText(ctx, api, field.label, x, 875, 26, C.muted);
    if (field.purchase) {
      drawPurchaseAge(ctx, api, field.purchase);
    } else if (field.value) {
      const print = () => {
        drawSqlText(ctx, api, field.value, x, 928, 38, field.color ?? C.ink);
        if (field.source) drawSqlText(ctx, api, field.source, x, 968, 24, C.muted);
      };
      if (field.target) api.focus.target(field.target, print);
      else print();
    } else {
      api.line(ctx, x, 935, x + 655, 935, C.muted, 2);
    }
  }
}
