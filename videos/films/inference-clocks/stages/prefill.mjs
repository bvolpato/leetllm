import { outputs, prompt, tokenTimes } from '../fixtures.mjs';
import { passage, spoken } from '../trace.mjs';

export function drawPrefill(ctx, scene, state, api) {
  const { C } = api;
  const row = passage(state, 0, 'causal-visibility', 0.53, 0.65) > 0 && state.beat === 0;
  const count = Math.floor(prompt.length * passage(state, 1, 'prompt-kv', 0.05, 0.29));
  const first = spoken(state, 1, 'first-prediction', 0.93);

  api.focus.target('prefill-readout-2', () => {
    api.text(ctx, 'Four known prompt tokens', 145, 280, 38, C.ink);
    prompt.forEach((word, i) => api.text(ctx, word, 390 + i * 147, 415, 34, C.blue, 'center'));
  });
  api.focus.target('prefill-field-grid', () => {
    prompt.forEach((word, i) => {
      const y = 455 + i * 89;
      api.text(ctx, word, 266, y + 47, 34, row && i === 1 ? C.yellow : C.ink, 'right');
      prompt.forEach((_, j) => {
        const visible = j <= i;
        const color = visible ? (row && i === 1 ? C.yellow : C.blue) : C.panel;
        api.rect(ctx, 332 + j * 147, y, 117, 64, color, visible ? color : C.muted, 3);
      });
    });
    api.text(ctx, 'Each row can read its own position and earlier columns.', 145, 893, 30, C.muted);
  });
  api.focus.target('cache-contents', () => {
    api.text(ctx, 'KV cache   ·   one layer', 1085, 280, 38, C.ink);
    api.text(ctx, 'Consumed', 1085, 415, 32, C.muted);
    api.text(ctx, 'Key', 1470, 415, 32, C.cyan, 'center');
    api.text(ctx, 'Value', 1650, 415, 32, C.pink, 'center');
    prompt.forEach((word, i) => {
      const y = 455 + i * 89;
      api.text(ctx, i < count ? word : '·', 1085, y + 47, 34, i < count ? C.ink : C.muted);
      for (const [x, color] of [
        [1470, C.cyan],
        [1650, C.pink],
      ]) {
        api.rect(ctx, x - 48, y + 10, 96, 42, i < count ? color : C.panel, C.muted, 3);
      }
    });
  });
  api.focus.target('first-output', () => {
    api.text(
      ctx,
      first ? 'T1   “' + outputs[0] + '”   ·   ' + tokenTimes[0] + ' ms' : 'First output pending',
      1085,
      893,
      40,
      first ? C.yellow : C.muted,
    );
  });
}

export default {
  id: 'prefill',
  draw: drawPrefill,
  cues: [
    'known-prompt',
    'causal-visibility',
    'prompt-kv',
    'first-prediction',
    'four-consumed',
    'emitted-not-consumed',
  ],
};
