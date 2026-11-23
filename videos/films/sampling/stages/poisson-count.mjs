import { poissonMass } from '../arithmetic.mjs';
import { cueStep } from '../construction.mjs';

const rate = 2.2;
const cutoff = Math.exp(-rate);
const tail = 1 - Array.from({ length: 6 }, (_, k) => poissonMass(k, rate)).reduce((a, b) => a + b);
const uniforms = [0.8, 0.7, 0.6, 0.5, 0.4];
const products = [1];
for (const draw of uniforms) products.push(products.at(-1) * draw);
const stop = products.findIndex((product) => product <= cutoff);
const count = stop - 1;

function drawBars(ctx, state, api) {
  const { C } = api;
  const bars = cueStep(state, 'sp-poisson-count-0', 0, 0.21, 0.5);
  const selectTail = cueStep(state, 'sp-poisson-count-1', 1, 0.12, 0.33);
  const plot = api.teaching.axes({
    x: 222,
    y: 342,
    width: 1018,
    height: 463,
    xDomain: [-0.5, 10.5],
    yDomain: [0, 0.3],
    xTicks: [0, 2, 4, 6, 8, 10],
    yTicks: [0, 0.1, 0.2, 0.3],
    xLabel: 'tool calls per request',
    yLabel: 'probability',
  });
  for (let k = 0; k <= 10; k++) {
    const top = plot.point(k - 0.36, bars * poissonMass(k, rate));
    const base = plot.point(k + 0.36, 0);
    if (base.y > top.y)
      api.rect(
        ctx,
        top.x,
        top.y,
        base.x - top.x,
        base.y - top.y,
        k >= 6 && selectTail > 0 ? C.pink : C.blue,
        null,
        2,
      );
  }
  api.math(ctx, 'P(C=k)=e^{-\\lambda}\\lambda^k/k!', 1550, 435, 35, C.ink, 'center');
  api.text(ctx, 'Mean = variance', 1550, 555, 34, C.muted, 'center');
  api.text(ctx, String(rate), 1550, 635, 65, C.yellow, 'center');
  if (selectTail === 1) {
    api.text(ctx, 'Six or more calls', 1550, 755, 35, C.muted, 'center');
    api.text(ctx, (100 * tail).toFixed(1) + '%', 1550, 836, 63, C.pink, 'center');
  }
}

function drawProducts(ctx, state, api) {
  const { C } = api;
  const four = cueStep(state, 'sp-poisson-count-2', 2, 0.62, 0.8);
  const crossing = cueStep(state, 'poisson-crossing', 3, 0.02, 0.3);
  const returned = cueStep(state, 'poisson-return', 3, 0.35, 0.45);
  const plot = api.teaching.axes({
    x: 220,
    y: 333,
    width: 1030,
    height: 454,
    xDomain: [0, 5.2],
    yDomain: [0, 1],
    xTicks: [0, 1, 2, 3, 4, 5],
    yTicks: [0, 0.5, 1],
    xLabel: 'number of draws',
    yLabel: 'running product',
  });
  api.path(ctx, [plot.point(0, cutoff), plot.point(5.2, cutoff)], { color: C.yellow, width: 4 });
  const drawn = count * four + crossing;
  const landed = Math.floor(drawn);
  for (let i = 0; i <= landed; i++) {
    const end = plot.point(i, products[i]);
    if (i > 0)
      api.path(ctx, [plot.point(i - 1, products[i - 1]), end], {
        color: i === stop ? C.pink : C.cyan,
        width: 5,
      });
    api.circle(ctx, end.x, end.y, 11, i === stop ? C.pink : C.cyan);
  }
  if (drawn > landed) {
    const product = api.lerp(products[landed], products[landed + 1], drawn - landed);
    api.path(ctx, [plot.point(landed, products[landed]), plot.point(drawn, product)], {
      color: landed === count ? C.pink : C.cyan,
      width: 5,
    });
  }
  api.text(ctx, 'Cutoff', 1540, 365, 35, C.muted, 'center');
  api.math(ctx, 'e^{-2.2}\\approx ' + cutoff.toFixed(3), 1540, 441, 45, C.yellow, 'center');
  api.text(ctx, 'Product', 1540, 555, 35, C.muted, 'center');
  api.text(
    ctx,
    String(Number(products[landed].toFixed(4))),
    1540,
    639,
    64,
    landed === stop ? C.pink : C.cyan,
    'center',
  );
  if (returned === 1)
    api.text(ctx, 'Return ' + count + ' calls', 1540, 804, 50, C.yellow, 'center');
  if (four === 1)
    api.text(
      ctx,
      products[count].toFixed(3) +
        ' × ' +
        uniforms[count] +
        (crossing === 1 ? ' = ' + products[stop].toFixed(4) : ' = ?'),
      740,
      971,
      45,
      C.ink,
      'center',
    );
}

export function drawPoissonCount(ctx, scene, state, api) {
  api.focus.target('sp-poisson-count-visual', () => {
    if (state.beat < 2) drawBars(ctx, state, api);
    else drawProducts(ctx, state, api);
  });
}

export default {
  id: 'poisson-count',
  draw: drawPoissonCount,
  cues: [
    'sp-poisson-count-0',
    'sp-poisson-count-1',
    'sp-poisson-count-2',
    'poisson-crossing',
    'poisson-return',
  ],
};
