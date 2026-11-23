import { cueProgress, servingWindow } from '../arithmetic.mjs';

const price = { lookupCost: 0.00008, generationCost: 0.004 };
const full = servingWindow(10000, 5714, price);
const smallPrice = { lookupCost: 0.00006, generationCost: 0.003 };
const small = servingWindow(2000, 30, smallPrice);

export function drawBreakEven(ctx, scene, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const check = state.beat >= 2;
  const w = check ? small : full;
  const prices = check ? smallPrice : price;
  const dollars = (n, places) => '$' + n.toFixed(places);
  const avoided = w.hits * prices.generationCost;
  const fee = w.n * prices.lookupCost;
  const scaling = check ? 1060 / 0.16 : 1060 / 30;
  const showSavings = check
    ? state.beat >= 3
    : cueProgress(state, 0, 'sc-saving-full', 0.55, 0.76) > 0;
  const showRate = !check && state.beat >= 1;
  const grouped = (n) => n.toLocaleString('en-US');
  txt(grouped(w.n) + ' eligible exact misses', 112, 241, 39, C.ink);
  txt(grouped(w.hits) + ' safe hits', 112, 318, 43, C.blue);
  txt(grouped(w.generations) + ' fresh generations', 790, 318, 43, C.muted);
  const entries = [
    {
      y: 458,
      label: 'Generation avoided',
      expr: grouped(w.hits) + ' × ' + dollars(prices.generationCost, 3),
      value: avoided,
      color: C.blue,
    },
    {
      y: 674,
      label: 'All lookup charges',
      expr: grouped(w.n) + ' × ' + dollars(prices.lookupCost, 5),
      value: fee,
      color: C.yellow,
    },
  ];
  focus.target('cost-rows', () => {
    for (const e of entries) {
      txt(e.label, 112, e.y, 35);
      txt(e.expr, 112, e.y + 57, 33, C.muted);
      api.rect(ctx, 745, e.y - 30, e.value * scaling, 43, e.color, undefined, 4);
      txt(dollars(e.value, check ? 2 : 3), 747, e.y + 69, 42, e.color);
    }
  });
  api.line(ctx, 112, 807, 1808, 807, C.panel, 3);
  focus.target('net-saving', () => {
    const net =
      w.saving < 0
        ? 'Extra cost    ' + dollars(-w.saving, 2)
        : 'Forecast saving    ' + dollars(w.saving, 3);
    txt(
      showSavings ? net : 'Does reuse save money here?',
      112,
      900,
      48,
      showSavings ? (w.saving < 0 ? C.pink : C.green) : C.yellow,
    );
    if (showRate || state.beat >= 3) {
      txt('Break-even safe-hit fraction', 1120, 865, 30, C.muted);
      txt(
        dollars(prices.lookupCost, 5) +
          ' ÷ ' +
          dollars(prices.generationCost, 3) +
          ' = ' +
          Math.round(100 * w.breakEven) +
          '%',
        1120,
        925,
        36,
      );
    }
    if (!check && state.beat === 0 && showSavings) {
      txt('Serving cost    $40.000 − $22.056 = $17.944', 112, 985, 34, C.muted);
    }
    if (state.beat === 1)
      txt(
        'Shadow trial    ' +
          grouped(w.shadowGenerations) +
          ' generations + all lookups = ' +
          dollars(w.shadowCost, 2),
        112,
        985,
        34,
        C.muted,
      );
  });
}
export default {
  id: 'break-even',
  draw: drawBreakEven,
  cues: ['cost-window', 'sc-saving-full', 'sc-break-two', 'smaller-window', 'price-result'],
};
