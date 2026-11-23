import { sampleModel } from '../model.mjs';
import { weightMemory } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';
import { drawLegacyCard, drawLegacyMath, drawLegacyText, drawText } from '../defaults.mjs';
import assert from 'node:assert/strict';
function drawEstablishedLifecycle(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('compression', state);
  {
    const stages = ['post-training', 'evaluation', 'compression', 'serving'],
      labels = [
        'v4 · trained checkpoint',
        'v4 · candidate under test',
        'v4 · quantized derivative',
        'v4 / INT4 · runtime artifact',
      ];
    const current = stages.indexOf('compression');
    const x = 550 + current * 250;
    api.line(ctx, 550, 235, 1300, 235, themeColors.muted, 2);
    stages.forEach((id, i) =>
      api.circle(ctx, 550 + i * 250, 235, 8, i <= current ? themeColors.green : themeColors.muted),
    );
    drawLegacyText(ctx, api, labels[current], x, 205, 24, themeColors.green, 'center');
  }
  {
    drawLegacyText(
      ctx,
      api,
      '70B parameters · ideal weight storage',
      960,
      300,
      28,
      themeColors.muted,
      'center',
    );
    modelState.precisions.forEach((precision, index) => {
      const colors = [themeColors.blue, themeColors.cyan, themeColors.green];
      api.focus.target('weight-storage-' + index, () =>
        drawLegacyCard(
          ctx,
          api,
          precision + ' · ' + modelState.bytes[index].toFixed(1) + ' GiB',
          200 + index * 520,
          365,
          470,
          92,
          colors[index],
          29,
        ),
      );
    });
    const storageProgress =
      modelState.step === 0 ? api.ease(Math.max(0, Math.min(1, (modelState.p - 0.12) / 0.56))) : 1;
    const currentBytes =
      modelState.bytes[0] + (modelState.bytes[2] - modelState.bytes[0]) * storageProgress;
    api.rect(ctx, 310, 490, 1300, 42, themeColors.panel, themeColors.muted, 2, 6);
    api.focus.target('quantized-weight-bytes', () =>
      api.rect(
        ctx,
        310,
        490,
        (1300 * currentBytes) / modelState.bytes[0],
        42,
        themeColors.green,
        themeColors.green,
        0,
        6,
      ),
    );
    drawLegacyText(
      ctx,
      api,
      `v4 · ${storageProgress === 1 ? 'INT4 weight artifact' : 'illustrated storage transition'} · ${currentBytes.toFixed(1)} GiB`,
      960,
      555,
      25,
      themeColors.green,
      'center',
    );
    if (modelState.step > 0) {
      api.focus.target('per-request-cache', () =>
        drawLegacyCard(
          ctx,
          api,
          'KV cache · ' + modelState.cachePerRequest.toFixed(1) + ' GiB / request',
          310,
          570,
          600,
          88,
          themeColors.yellow,
          25,
        ),
      );
      drawLegacyCard(
        ctx,
        api,
        'Two requests · ' + (2 * modelState.cachePerRequest).toFixed(1) + ' GiB',
        1010,
        570,
        600,
        88,
        themeColors.cyan,
        25,
      );
      api.focus.target('weights-plus-cache', () =>
        drawLegacyMath(
          ctx,
          api,
          modelState.bytes[2].toFixed(1) +
            '+2\\times' +
            modelState.cachePerRequest.toFixed(1) +
            '=' +
            modelState.twoRequestSubtotal.toFixed(1) +
            '\\;\\text{GiB}',
          960,
          700,
          38,
        ),
      );
    }
    if (modelState.step === 2) {
      drawLegacyText(
        ctx,
        api,
        'AWQ scales activation-sensitive channels · GPTQ compensates calibration error',
        960,
        755,
        23,
        themeColors.muted,
        'center',
      );
      const allocation = teaching.allocation({
        x: 340,
        y: 780,
        width: 1240,
        height: 210,
        capacity: 60,
        unit: 'GiB',
        parts: [
          {
            id: 'weights',
            label: '  INT4 weights',
            value: modelState.bytes[2],
            color: themeColors.green,
          },
          {
            id: 'cache',
            label: '  Two request caches',
            value: 2 * modelState.cachePerRequest,
            color: themeColors.cyan,
          },
        ],
        format: (value) => value.toFixed(1),
        fontSize: 22,
      });
      assert(Math.abs(allocation.used - modelState.twoRequestSubtotal) < 1e-9);
      assert(Math.abs(allocation.remaining - modelState.remainingAt60) < 1e-9);
      drawLegacyText(
        ctx,
        api,
        '48 GiB device · short by ' +
          modelState.shortfallAt48.toFixed(1) +
          ' GiB before runtime overhead',
        960,
        1010,
        25,
        themeColors.pink,
        'center',
      );
    }
  }
}
function drawLifecycleUpgrade(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat !== 3) return false;
  const { C: themeColors } = api;
  const clock = sceneCues(scene, state);
  const cue = clock.started;
  const full = weightMemory();
  if (cue('kv-window')) {
    const window = weightMemory(full.tokens / 2);
    const left = 576,
      right = 1735;
    const firstKept =
      left + (right - left) * (1 - window.tokens / full.tokens) * clock.progress('kv-window');
    const number = (value) => value.toLocaleString('en-US');
    drawText(
      ctx,
      api,
      'One request   ·   ' + number(full.tokens) + ' tokens processed',
      960,
      324,
      56,
      themeColors.ink,
      'center',
    );
    for (const [y, label, start, color] of [
      [490, 'Full attention', left, themeColors.blue],
      [740, 'Sliding window', firstKept, themeColors.cyan],
    ]) {
      drawText(ctx, api, label, 144, y + 14, 43, themeColors.ink);
      api.rect(ctx, left, y - 30, right - left, 60, themeColors.panel);
      api.rect(ctx, start, y - 30, right - start, 60, color);
    }
    drawText(
      ctx,
      api,
      number(full.tokens) + ' cached tokens',
      right,
      601,
      38,
      themeColors.ink,
      'right',
    );
    drawText(ctx, api, full.cachePerRequest + ' GiB', 144, 592, 60, themeColors.blue);
    if (clock.after('kv-window'))
      drawText(
        ctx,
        api,
        number(window.tokens) + ' newest tokens',
        right,
        851,
        38,
        themeColors.ink,
        'right',
      );
    if (clock.after('kv-window-result'))
      drawText(ctx, api, window.cachePerRequest + ' GiB', 144, 842, 60, themeColors.cyan);
    return true;
  }
  {
    const factors = [
        ['2', 'K and V'],
        [full.layers, 'layers'],
        [full.kvHeads, 'KV heads'],
        [full.headDim, 'head dimension'],
        [full.tokens, 'cached tokens'],
        [full.bytesPerElement, 'bytes / element'],
      ],
      names = ['kv-pair', 'kv-layers', 'kv-heads', 'kv-dimension', 'kv-tokens', 'kv-bytes'];
    const seen = factors.filter((_, i) => cue(names[i]));
    for (let k = 0; k < 2; k++) {
      const x = 190 + k * 510,
        y = 430;
      for (let layer = 2; layer >= 0; layer--)
        api.rect(
          ctx,
          x + layer * 19,
          y - layer * 25,
          380,
          240,
          themeColors.panel,
          k ? themeColors.cyan : themeColors.blue,
          2,
        );
      drawText(
        ctx,
        api,
        k ? 'Values V' : 'Keys K',
        x + 190,
        y + 140,
        38,
        k ? themeColors.cyan : themeColors.blue,
        'center',
      );
      drawText(
        ctx,
        api,
        full.tokens.toLocaleString('en-US') + ' token positions',
        x + 190,
        785,
        28,
        themeColors.muted,
        'center',
      );
    }
    factors.forEach(([v, label], i) => {
      const color = cue(names[i]) ? themeColors.yellow : themeColors.muted;
      drawText(ctx, api, v, 1340, 350 + i * 75, 35, color, 'right');
      drawText(ctx, api, label, 1370, 350 + i * 75, 28, color);
    });
    drawText(
      ctx,
      api,
      seen.map((x) => x[0]).join(' × ') +
        (clock.after('kv-result') ? ' / 2³⁰ = ' + full.cachePerRequest + ' GiB per request' : ''),
      960,
      915,
      36,
      themeColors.yellow,
      'center',
    );
  }
  return true;
}
export function drawCompression(ctx, scene, state, api) {
  let handled = false;
  api.focus.target('compression-mechanism', () => {
    handled = drawLifecycleUpgrade(ctx, scene, state, api);
  });
  if (handled) return;
  api.focus.target('compression-mechanism', () => drawEstablishedLifecycle(ctx, scene, state, api));
}
export default {
  id: 'compression',
  draw: drawCompression,
  cues: [
    'weight-storage-2-b1-1',
    'weights-plus-cache-b2-1',
    'weights-plus-cache-b3-1',
    'compression-extension-4',
    'kv-pair',
    'kv-layers',
    'kv-heads',
    'kv-dimension',
    'kv-tokens',
    'kv-bytes',
    'kv-result',
    'kv-window',
    'kv-window-result',
  ],
};
