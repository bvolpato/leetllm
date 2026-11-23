import { featureFrame } from '../model.mjs';

const categories = ['A100', 'H100', 'other'];
const layout = categories.map((_, i) => 775 + i * 400);
const pools = 14,
  rows = 5;

export function drawCategoryContract(ctx, scene, state, api) {
  const f = featureFrame(state);
  const { C } = api;
  const t = (s, x, y, size, ink = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, ink, align);

  api.focus.target('category-contract-operation', () => {
    if (f.b < 2) {
      t('Fitted layout', 160, 289, 39, C.muted, 'left');
      categories.forEach((name, i) => t(name, layout[i], 374, 47));
      const map = f.progress('feature-category-map', 0);
      const other = categories.indexOf('other');
      const bits = (y, active, ink, ready) => {
        layout.forEach((x, i) => {
          const on = ready && i === active;
          api.rect(ctx, x - 130, y - 76, 260, 126, on ? ink : C.panel, on ? ink : C.muted);
          if (ready) t(String(Number(on)), x, y + 14, 62, on ? C.bg : C.ink);
        });
      };
      if (f.b === 0) {
        const ready = f.completed('feature-category-map', 0);
        t('New pool', 278, 505, 34, C.muted);
        const x = api.lerp(278, layout[other], map);
        api.rect(ctx, x - 75, 571, 150, 74, C.yellow);
        t('L4', x, 622, 45, C.bg);
        bits(785, other, C.yellow, ready);
      } else {
        t('L4  →  ignore unknown', 125, 534, 38, C.cyan, 'left');
        bits(523, -1, C.cyan, f.completed('category-contract-1', 1));
        t('L4  →  reserved other', 125, 775, 38, C.yellow, 'left');
        bits(764, other, C.yellow, true);
      }
      return;
    }

    t('One active pool per job', 960, 286, 42);
    let activeCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < pools; col++) {
        const active = (r * 3) % pools === col;
        const x = 330 + col * 96,
          y = 356 + r * 84;
        api.rect(ctx, x, y, 80, 65, active ? C.cyan : C.panel, active ? C.cyan : C.muted, 4);
        if (active) {
          activeCount++;
          t('1', x + 40, y + 46, 32, C.bg);
        }
      }
    }
    t(
      f.completed('category-contract-2', 2)
        ? activeCount + ' nonzero entries in ' + rows * pools + ' positions'
        : rows + ' jobs  ×  ' + pools + ' pools',
      960,
      902,
      48,
      C.cyan,
    );
  });
}

export default {
  id: 'category-contract',
  draw: drawCategoryContract,
  cues: [
    'category-contract-0',
    'feature-category-map',
    'category-contract-1',
    'category-contract-2',
  ],
};
