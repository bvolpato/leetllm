import { trainingInventory } from '../model.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';
import { text, rect, line } from '../defaults.mjs';
import { num, point } from '../geometry.mjs';

export function drawMemory(ctx, scene, state, api) {
  const { C } = api;
  const samples = [trainingInventory(8), trainingInventory(13), trainingInventory(13, 0.5)];
  const baseReady = resultAfter(state, 'memory-short', 0, 0.85);
  const longReady = resultAfter(state, 'memory-long', 1, 0.83);
  const halfReady = resultAfter(state, 'memory-half', 3, 0.34);
  const cap = samples[0].capacity;
  const start = 566,
    unit = 32;
  const capX = start + unit * cap;
  const quantized = state.beat === 4;
  text(
    ctx,
    api,
    'Illustrative peak inventory  ·  decimal GB  ·  fixed microbatch',
    150,
    240,
    32,
    C.muted,
  );
  const legendX = [155, 625, 1000, 1430];
  for (const [i, part] of samples[0].parts.entries()) {
    const label = i < 2 ? part.label + '  ' + part.gb + ' GB' : part.label;
    const color = C[part.color];
    rect(ctx, api, legendX[i], 292, 23, 23, color, undefined, 3);
    text(ctx, api, label, legendX[i] + 40, 315, 32, color);
  }

  const names = ['1,024 tokens', '2,048 tokens', 'Half the adapter state'];
  const longer = cueMotion(state, 'memory-length', 1, 0.1, 0.29) > 0;
  const presents = [true, longer && !quantized, state.beat >= 2 && !quantized];
  const completed = [baseReady, longReady, halfReady];
  const weightsIn = cueMotion(state, 'memory-weights', 0, 0.02, 0.15);
  const stack = cueMotion(state, 'memory-stack', 0, 0.4, 0.7);
  const grow = cueMotion(state, 'memory-grow', 1, 0.36, 0.65);
  const shrink = cueMotion(state, 'memory-half', 3, 0.06, 0.34);
  api.focus.target('memory-bars', () => {
    text(ctx, api, cap + ' GB limit', capX, 387, 33, C.ink, 'center');
    for (const [i, sample] of samples.entries()) {
      if (!presents[i]) continue;
      const y = 455 + i * 155;
      text(ctx, api, names[i], 155, y + 35, 34, C.ink);
      const [frozen, buffers, activation, adapter] = sample.parts.map((part) => part.gb);
      const previousActivation = samples[0].parts[2].gb;
      const previousAdapter = samples[1].parts[3].gb;
      const activationLabel =
        i === 1 && grow < 1 ? previousActivation + ' → ' + activation : activation;
      text(
        ctx,
        api,
        activationLabel + ' GB activations  +  ' + num(adapter) + ' GB adapter state',
        start,
        y - 18,
        28,
        C.muted,
      );
      let offset = start;
      const shownGB = [
        [frozen * weightsIn, buffers * stack, activation * stack, adapter * stack],
        [frozen, buffers, previousActivation + (activation - previousActivation) * grow, adapter],
        [frozen, buffers, activation, previousAdapter + (adapter - previousAdapter) * shrink],
      ][i];
      const pending = i === 2 && state.beat < 3;
      for (const [j, part] of sample.parts.entries()) {
        const width = unit * (pending && j >= 2 ? 0 : shownGB[j]);
        if (width > 0.2) rect(ctx, api, offset, y, width, 48, C[part.color], undefined, 0);
        offset += width;
      }
      text(
        ctx,
        api,
        completed[i] ? num(sample.total) : '?',
        1780,
        y + 38,
        42,
        completed[i] ? C.ink : C.muted,
        'center',
        'mono',
      );
    }
    line(ctx, api, point(capX, 406), point(capX, quantized ? 520 : 837), C.ink, 3);
  });
  api.focus.target('memory-next', () => {
    if (quantized) {
      text(
        ctx,
        api,
        'Inside the blue allocation  ·  four supported base weights',
        155,
        625,
        38,
        C.blue,
      );
      text(ctx, api, '16-bit weights', 155, 730, 34, C.ink);
      text(ctx, api, 'QLoRA payload', 155, 848, 34, C.ink);
      const encode = cueMotion(state, 'memory-quantized', 4, 0.2, 0.48);
      for (let i = 0; i < 4; i++) {
        rect(ctx, api, start + i * 153, 684, 144, 62, C.blue, undefined, 5);
        if (encode > i / 4) rect(ctx, api, start + i * 45, 802, 36, 62, C.blue, undefined, 5);
      }
      if (encode >= 1) text(ctx, api, '4-bit codes  +  block scales', 805, 847, 37, C.blue);
      text(
        ctx,
        api,
        'Reconstruct weights for compute. Measure the new training peak.',
        155,
        969,
        34,
        C.muted,
      );
    } else {
      let prompt = 'The frozen network still runs on every ticket.';
      if (state.beat === 1) prompt = 'Same weights, same adapter. Only the ticket length changes.';
      if (state.beat === 2)
        prompt = 'At 2,048 tokens, will half the adapter state bring the peak under 32 GB?';
      if (state.beat === 3)
        prompt = halfReady
          ? '33.5 GB  ·  1.5 GB over capacity'
          : 'Recalculate the peak with 0.5 GB of adapter state.';
      text(ctx, api, prompt, 155, 955, 38, halfReady ? C.yellow : C.ink);
    }
  });
}

export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'memory-weights',
    'memory-stack',
    'memory-short',
    'memory-length',
    'memory-grow',
    'memory-long',
    'memory-question',
    'memory-half',
    'memory-quantized',
  ],
};
