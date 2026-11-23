import { featureNames, featureWeights } from '../fixtures.mjs';
import { featureFrame, featureSum, featureVector } from '../model.mjs';

const original = featureVector({
  pool: 'a100-pool',
  queued: 42,
  heartbeat: 0.5,
  backlog: 18,
  priority: false,
});
const swapped = [...original];
[swapped[3], swapped[4]] = [swapped[4], swapped[3]];
const originalScore = featureSum(original);
const swappedScore = featureSum(swapped);
const slots = [3, 4, 5];
const names = ['Queue slot', 'Heartbeat slot', 'Backlog slot'];
const products = ['queued', 'heartbeat', 'backlog'];
const fmt = (value) => String(Number(value.toFixed(4)));

export function drawVectorConstruction(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, x, y, size, ink = C.ink) => api.text(ctx, s, x, y, size, ink, 'center');
  const colors = [C.blue, C.pink, C.green];

  api.focus.target('vector-construction-operation', () => {
    if (f.b === 0) {
      t('J-204 at 09:00', 960, 313, 48);
      const progress = f.progress('feature-vector-build', 0);
      featureNames.forEach((name, i) => {
        const x = 232 + i * 208;
        const ink = colors[slots.indexOf(i)] ?? C.muted;
        t(name, x, 479, 32, ink);
        api.rect(ctx, x - 89, 522, 178, 130, C.panel, ink);
        if (progress > i / original.length) t(String(original[i]), x, 611, 59, ink);
      });
      t('Keep the slot order, units and preprocessing rules with the model.', 960, 830, 37);
      return;
    }

    const exchanging = f.b === 2;
    const restore = f.progress('feature-layout-restore', 2);
    const travel = f.progress('vector-construction-2', 2) * (1 - restore);
    const restoring = f.started('feature-layout-restore', 2);
    const score = exchanging && !restoring ? swappedScore : originalScore;
    const settled = travel === 0 || travel === 1;
    const result = exchanging
      ? restoring
        ? f.completed('feature-layout-restore', 2)
        : f.completed('feature-layout-swap', 2)
      : f.completed('feature-vector-result', 1);
    const centers = [382, 960, 1538];

    t('Linear score  ·  fixed example weights', 960, 251, 38, C.muted);
    for (const [i, slot] of slots.entries()) {
      const x = centers[i];
      t(names[i], x, 353, 44);
      api.rect(ctx, x - 166, 584, 332, 78, C.panel, C.muted);
      t('× ' + featureWeights[slot], x, 638, 45);
    }
    for (const [i, slot] of slots.entries()) {
      const x = centers[i];
      const direction = i === 0 ? 1 : i === 1 ? -1 : 0;
      const operandX = x + direction * (centers[1] - centers[0]) * travel;
      const operandY = 488 - direction * 72 * Math.sin(Math.PI * travel);
      t(String(original[slot]), operandX, operandY, 70, colors[i]);
      const ready = restoring
        ? f.completed('feature-layout-restore', 2)
        : f.completed('feature-' + (exchanging ? 'swapped-' : 'product-') + products[i], f.b);
      if (settled && ready) {
        t('= ' + fmt(score.terms[slot].contribution[0]), x, 738, 53);
      }
    }

    const start = 289,
      widthPerUnit = 1200;
    const y = 858;
    api.line(ctx, start, y, start + 1.1 * widthPerUnit, y, C.muted, 3);
    t('0', start, y + 71, 32, C.muted);
    t('1.1', start + 1.1 * widthPerUnit, y + 71, 32, C.muted);
    if (result) {
      for (const [i, slot] of slots.entries()) {
        const term = score.terms[slot];
        const color = travel === 1 && i < 2 ? colors[1 - i] : colors[i];
        api.rect(
          ctx,
          start + term.start[0] * widthPerUnit,
          y - 12,
          term.contribution[0] * widthPerUnit,
          24,
          color,
          undefined,
          0,
        );
      }
      const end = start + score.total[0] * widthPerUnit;
      api.circle(ctx, end, y, 15, C.ink);
      t('Score ' + fmt(score.total[0]), end, y - 46, 43);
    }
  });
}

export default {
  id: 'vector-construction',
  draw: drawVectorConstruction,
  cues: [
    'vector-construction-0',
    'feature-vector-build',
    'vector-construction-1',
    'feature-vector-products',
    'feature-vector-result',
    'feature-product-queued',
    'feature-product-heartbeat',
    'feature-product-backlog',
    'vector-construction-2',
    'feature-layout-swap',
    'feature-layout-restore',
    'feature-swapped-queued',
    'feature-swapped-heartbeat',
    'feature-swapped-backlog',
  ],
};
