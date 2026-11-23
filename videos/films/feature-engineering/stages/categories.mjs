import { featureFrame } from '../model.mjs';

const pools = ['A100', 'H100', 'L4'];

export function drawCategories(ctx, scene, state, api) {
  const f = featureFrame(state),
    { C } = api;
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  if (f.b <= 1) {
    api.focus.target('pool-codes', () => {
      t('Code used as a scalar input', 150, 262, 37, C.muted, 'left');
      const x = (code) => 450 + code * 540;
      api.line(ctx, x(0), 695, x(2), 695, C.muted, 4);
      for (const code of [0, 1, 2]) {
        api.line(ctx, x(code), 673, x(code), 716, C.muted, 3);
        t(String(code), x(code), 773, 43);
      }
      const p = f.progress('pool-exchange', 1);
      const xs = [x(0), x(1 + p), x(2 - p)];
      pools.forEach((pool, i) => {
        const y = 562 + (i === 1 ? -1 : i === 2 ? 1 : 0) * 116 * Math.sin(Math.PI * p);
        const color = [C.yellow, C.cyan, C.blue][i];
        if (p === 0 || p === 1) api.line(ctx, xs[i], y + 38, xs[i], 666, color, 2);
        t(pool, xs[i], y, 62, color);
      });
      if (f.started('pool-ruler', 0) && (p === 0 || p === 1))
        t('1 code unit from A100 to ' + pools[p === 0 ? 1 : 2], 960, 924, 42, C.yellow);
    });
    return;
  }
  api.focus.target('pool-bits', () => {
    t('Fitted layout', 145, 303, 36, C.muted, 'left');
    const cols = ['A100', 'H100', 'other'];
    cols.forEach((name, i) => t(name, 740 + i * 380, 364, 41, C.cyan));
    for (const [i, name] of pools.slice(0, 2).entries()) {
      const y = 492 + 168 * i;
      t(name, 270, y + 34, 47);
      api.arrow(ctx, 400, y + 16, 538, y + 16, C.muted, 3);
      cols.forEach((_, j) => {
        const filled = f.started(i === 0 ? 'pool-a100' : 'pool-h100', 2);
        const x = 740 + j * 380;
        api.rect(ctx, x - 125, y - 50, 250, 128, C.panel, filled && i === j ? C.cyan : C.muted);
        if (filled) t(String(Number(i === j)), x, y + 37, 57, i === j ? C.cyan : C.muted);
      });
    }
    t('New pool L4   →   ?', 960, 908, 48, C.yellow);
  });
}
export default {
  id: 'categories',
  draw: drawCategories,
  cues: ['pool-ruler', 'pool-exchange', 'pool-bits', 'pool-a100', 'pool-h100'],
};
