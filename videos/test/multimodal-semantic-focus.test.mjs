import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/multimodal-fusion.mjs';
const after = { phase: 'after', progress: 1 };
const during = (progress) => ({ phase: 'during', progress });
function paint(scene, state) {
  const stack = [],
    cards = [],
    routes = [],
    grids = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    clamp: (value) => Math.max(0, Math.min(1, value)),
    phase: (value, lo, hi) => Math.max(0, Math.min(1, (value - lo) / (hi - lo))),
    focus: {
      target: (id, fn) => {
        stack.push(id);
        try {
          return fn();
        } finally {
          stack.pop();
        }
      },
      visible: (id) => state.cues?.[id]?.phase !== 'before' && Boolean(state.cues?.[id]),
      progress: (id, fallback) => state.cues?.[id]?.progress ?? fallback,
    },
    components: {
      card: (options) => {
        cards.push({ ...options, targets: [...stack] });
        return options;
      },
      panel: (options, fn) => {
        fn();
        return options;
      },
    },
    teaching: {
      axes: (options) => ({ bounds: options, point: (x, y) => ({ x, y }) }),
      curve() {},
      transfer: (options) => routes.push({ ...options, targets: [...stack] }),
      grid: (options) => {
        grids.push({ ...options, targets: [...stack] });
        return options;
      },
    },
    text() {},
    math() {},
    path() {},
    circle() {},
    line() {},
  };
  draw({}, { id: scene }, state, api);
  return { cards, routes, grids };
}
test('encoder and meeting-point focus paint the real model and image/text routes', () => {
  const view = paint('opening', {
    beat: 1,
    beatP: 0.5,
    cues: {
      'opening-beat-2-focus-1': after,
      'opening-beat-2-focus-2': during(0.5),
    },
  });
  const model = view.cards.find((card) => card.label === 'Encoder + connector');
  assert(model.targets.includes('opening-image-encoding'));
  assert(model.targets.includes('opening-modality-meeting'));
  const incoming = view.routes.filter((route) =>
    route.targets.includes('opening-modality-meeting'),
  );
  assert.equal(incoming.length, 2);
  assert(incoming.every((route) => route.target.shape.label === 'Encoder + connector'));
  assert(incoming.some((route) => route.targets.includes('opening-image-encoding')));
});
test('the prefix clause paints a shared visual/text sequence rather than selecting the answer output', () => {
  const view = paint('closing', {
    beat: 0,
    beatP: 0.5,
    cues: {
      'closing-beat-1-focus-2': during(0.5),
    },
  });
  const prefix = view.grids.find((grid) => grid.targets.includes('closing-shared-prefix'));
  assert(prefix);
  assert.deepEqual(prefix.labels[0], ['v₁', 'v₂', 'v₃', '…', 'q₁', 'q₂', '…']);
  assert(
    !view.cards
      .find((card) => card.label === 'Answer + evidence')
      .targets.includes('closing-shared-prefix'),
  );
});
