import { deepGemmSentenceProgress, sampleDeepGemmVisual } from '../construction.mjs';
import { drawText, fmt } from '../defaults.mjs';
import { sentenceCues } from '../fixtures.mjs';

export function drawScales(ctx, scene, state, api) {
  const trace = sampleDeepGemmVisual(scene.id, state);
  const g = (b, i) => deepGemmSentenceProgress(scene.id, state, b, i);
  const dequantized = trace.b === 2 && g(2, 0) >= 1;
  const { C } = api;
  api.focus.target('scales-construction', () => {
    drawText(
      ctx,
      api,
      dequantized ? 'Dequantized coordinates' : 'Stored coordinates',
      130,
      235,
      37,
    );
    trace.raw.forEach((raw, i) => {
      const x = 125 + i * 850;
      const tone = i === 0 ? C.blue : C.cyan;
      const a = trace.a.slice(2 * i, 2 * i + 2).map((n) => (dequantized ? n * trace.sa[i] : n));
      const b = trace.z.slice(2 * i, 2 * i + 2).map((n) => (dequantized ? n * trace.sz[i] : n));
      drawText(ctx, api, 'K group ' + i, x + 390, 318, 38, tone, 'center');
      api.focus.target('scales-contribution-' + i, () => {
        drawText(ctx, api, 'A', x + 90, 414, 40, C.muted);
        drawText(ctx, api, 'B', x + 90, 500, 40, C.muted);
        for (let j = 0; j < a.length; j++) {
          const cx = x + 305 + j * 230;
          api.rect(ctx, cx - 79, 350, 158, 179, C.panel, tone, 8);
          drawText(ctx, api, fmt(a[j]), cx, 416, 50, C.ink, 'center');
          drawText(ctx, api, fmt(b[j]), cx, 502, 50, C.ink, 'center');
        }
        if (i >= trace.visibleGroups) return;
        const products = a.map((value, j) => fmt(value * b[j]));
        drawText(
          ctx,
          api,
          (dequantized ? 'Dot ' : 'Raw dot ') +
            products.join(' + ') +
            ' = ' +
            fmt(dequantized ? trace.partial[i] : raw),
          x + 390,
          603,
          38,
          tone,
          'center',
        );
        drawText(
          ctx,
          api,
          dequantized
            ? 'Both inputs already carry their scales'
            : 'Scale product   ' + trace.sa[i] + ' × ' + trace.sz[i] + ' = ' + trace.products[i],
          x + 390,
          658,
          30,
          C.yellow,
          'center',
        );
        const left = x + 95;
        api.rect(ctx, left, 705, raw * 100, 70, C.panel, C.muted, 2);
        api.rect(ctx, left, 705, trace.contributions[i] * 100, 70, tone, undefined, 2);
        const moving = trace.applied > 0 && trace.applied < 1 && trace.products[i] !== 1;
        drawText(
          ctx,
          api,
          trace.contributions[i].toFixed(2) + (moving ? ' · ruler' : ''),
          left + trace.contributions[i] * 100,
          831,
          38,
          tone,
          'center',
        );
      });
    });
    if (trace.sumReady) {
      drawText(
        ctx,
        api,
        trace.partial.map(fmt).join(' + ') + ' = ' + fmt(trace.result),
        960,
        926,
        61,
        C.green,
        'center',
      );
    } else if (trace.visibleGroups === 2 && g(0, 3) > 0) {
      drawText(ctx, api, 'Scaled dot product = ?', 960, 926, 49, C.yellow, 'center');
    }
    if (trace.b === 1 && g(1, 3) >= 1) {
      const rawSum = trace.raw.reduce((a, b) => a + b, 0);
      drawText(
        ctx,
        api,
        'Borrowing group 0’s factor gives ' +
          rawSum +
          ' × ' +
          trace.products[0] +
          ' = ' +
          rawSum * trace.products[0],
        960,
        1002,
        32,
        C.pink,
        'center',
      );
    }
  });
}
export default { id: 'scales', draw: drawScales, cues: sentenceCues('scales') };
