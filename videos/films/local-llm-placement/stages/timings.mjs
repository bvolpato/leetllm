import { receipt } from '../fixtures.mjs';
import { rates } from '../model.mjs';
import { cueProgress } from '../worksheet.mjs';

export function drawTimings(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const missing = p('remove-duration') > 0;
  const r = rates(missing ? { ...receipt, outputNs: undefined } : receipt);
  const x = 150,
    width = 1500,
    cachedWidth = (width * receipt.cached) / receipt.prompt;
  text('Completed server receipt   /   synthetic request', x, 261, 34, C.muted);
  focus.target('prompt-span', () => {
    text('Input   ·   1,000 prompt tokens', x, 360, 40);
    api.rect(ctx, x, 414, width, 90, C.cyan, undefined, 3);
    api.rect(ctx, x, 414, cachedWidth, 90, C.blue, undefined, 3);
    text('600 reused', x + cachedWidth / 2, 473, 36, C.bg, 'center');
    const count = p('selected-count') === 1 ? r.uncached + ' evaluated' : 'Remaining input';
    text(count, x + (cachedWidth + width) / 2, 473, 36, C.bg, 'center');
    const left = x + cachedWidth * p('select-span');
    api.line(ctx, left, 535, x + width, 535, C.yellow, 4);
    api.line(ctx, left, 523, left, 548, C.yellow, 4);
    api.line(ctx, x + width, 523, x + width, 548, C.yellow, 4);
    const prompt =
      state.beat === 0 ? 'Which span took 0.2 seconds?' : 'Prompt evaluation   ·   0.2 s';
    text(prompt, x + (left - x + width) / 2, 601, 32, C.yellow, 'center');
  });
  focus.target('prompt-rate', () => {
    const result = p('prompt-result') === 1;
    let equation = 'Reported prompt time   200,000,000 ns';
    if (p('selected-count') === 1) equation = r.uncached + ' tokens ÷ 0.2 s';
    if (result) equation += ' = ' + r.prefill.toLocaleString('en-US') + ' tokens/s';
    text(equation, x, 707, 39, result ? C.green : C.muted);
  });
  focus.target('output-rate', () => {
    text('Generated output', x, 832, 35);
    if (p('own-duration') > 0) {
      text('80 tokens', 615, 832, 36, C.cyan);
      text(missing ? 'Time missing' : '2 seconds', 1020, 832, 36, missing ? C.yellow : C.cyan);
      if (p('own-duration') === 1)
        text(
          missing ? 'Unavailable' : r.output + ' tokens/s',
          1730,
          832,
          36,
          missing ? C.yellow : C.green,
          'right',
        );
    }
    if (missing) text('First visible token and token gaps need client arrival times.', x, 968, 35);
  });
}
export default {
  id: 'timings',
  draw: drawTimings,
  cues: [
    'cached-prefix',
    'which-time',
    'select-span',
    'selected-count',
    'prompt-result',
    'own-duration',
    'remove-duration',
  ],
};
