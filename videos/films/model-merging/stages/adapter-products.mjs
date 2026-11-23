import { adapterMergeExample } from '../fixtures.mjs';
import { after, started } from '../decisions.mjs';

export function drawAdapterProducts(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const f = adapterMergeExample(),
    correct = after(state, 'adapter-exact');
  const stacked = started(state, 'adapter-stack'),
    crossed = after(state, 'adapter-cross');
  const showTarget = after(state, 'adapter-mix');
  const grid = (x, y, width, values, color, highlightCorner = false) => {
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) {
        const corner = highlightCorner && r === 0 && c === 1;
        const v = values?.[r][c];
        api.rect(
          ctx,
          x + c * width,
          y + r * width,
          width - 7,
          width - 7,
          C.panel,
          corner ? C.yellow : color,
          5,
        );
        label(
          v === undefined ? (corner ? '?' : '·') : String(v),
          x + (c + 0.5) * width - 4,
          y + (r + 0.58) * width,
          width > 125 ? 47 : 32,
          corner ? C.yellow : v === 0 || v === undefined ? C.muted : color,
          'center',
        );
      }
  };
  api.focus.target('products', () => {
    label('Unit-scale updates', 165, 293, 37, C.muted);
    f.factors.forEach(({ a, b }, i) => {
      const y = 353 + 270 * i,
        col = i === 0 ? C.blue : C.pink;
      const mat = b.map((v) => a.map((w) => v * w));
      label(i === 0 ? 'Code' : 'Math', 135, y + 42, 38, col);
      label('B = [' + b.join(', ') + ']ᵀ', 135, y + 109, 31, col);
      label('A = [' + a.join(', ') + ']', 135, y + 162, 31, col);
      grid(407, y, 92, mat, col);
    });
  });
  api.focus.target('desired', () => {
    label('Mean of the products', 680, 293, 37, C.ink);
    grid(720, 430, 150, showTarget ? f.desired : undefined, C.cyan);
    label('½ B₁A₁ + ½ B₂A₂', 870, 835, 34, C.cyan, 'center');
  });
  api.focus.target('factor-product', () => {
    const compare = state.beat >= 1;
    if (!compare) return;
    label(stacked ? 'Paired factors' : 'Product of the means', 1240, 293, 37, C.ink);
    grid(
      1280,
      430,
      150,
      stacked ? (correct ? f.desired : undefined) : crossed ? f.wrong : undefined,
      stacked ? C.cyan : crossed ? C.pink : C.muted,
      !stacked,
    );
    if (stacked) {
      api.math(
        ctx,
        String.raw`\begin{bmatrix}0.5&0\\0&0.5\end{bmatrix}\begin{bmatrix}1&0\\0&1\end{bmatrix}`,
        1430,
        854,
        36,
        C.ink,
        'center',
      );
      if (correct) label('2 independent directions', 1430, 965, 32, C.cyan, 'center');
    } else {
      api.math(
        ctx,
        String.raw`\begin{bmatrix}0.5\\0.5\end{bmatrix}\begin{bmatrix}0.5&0.5\end{bmatrix}`,
        1430,
        854,
        36,
        C.ink,
        'center',
      );
      if (crossed) label('Upper right   ½ × ½ = ¼', 1430, 965, 32, C.yellow, 'center');
    }
  });
}
export default {
  id: 'adapter-products',
  draw: drawAdapterProducts,
  cues: [
    'adapter-one',
    'adapter-two',
    'adapter-mix',
    'adapter-corner',
    'adapter-cross',
    'adapter-stack',
    'adapter-exact',
  ],
};
