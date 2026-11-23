import { sampleModel } from '../model.mjs';
import { invoicePage } from '../invoice-page.mjs';

export function drawReplay(ctx, scene, state, api) {
  const { store, fixedMode, newEventVisible } = sampleModel('replay', state);
  invoicePage(ctx, api, {
    store,
    shown: Math.max(store.deliveries.length, newEventVisible ? 3 : 2),
    source: fixedMode ? 'Candidate  /  sequential fixture' : 'Base  /  sequential fixture',
    mode: fixedMode ? 'Look up the key before creating' : 'Create on every delivery',
    accent: fixedMode ? api.C.cyan : api.C.pink,
    footer: !fixedMode
      ? 'Retry identity differs from the first return.'
      : store.count === 2
        ? 'Two distinct keys. Two stored invoices.'
        : 'Both returns point to the first stored invoice.',
  });
}

export default {
  id: 'replay',
  draw: drawReplay,
  cues: ['replay-b1-1', 'coding-candidate-check', 'replay-b2-1', 'replay-b2-2', 'replay-b2-3'],
};
