import { pricedTokens } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawTokenCost(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  if (state.beat === 0) {
    const x = 150,
      scale = 0.68;
    const spans = [
      { name: 'Retrieval', ms: 420, color: C.blue },
      { name: 'Generation', ms: 1850, color: C.cyan },
    ];
    let elapsed = 0;
    api.focus.target('spans', () => {
      api.text(ctx, 'Illustrative request   /   two sequential child spans', x, 299, 38, C.ink);
      for (const span of spans) {
        const left = x + elapsed * scale;
        const width = span.ms * scale;
        api.rect(ctx, left, 465, width, 96, span.color, undefined, 0);
        api.text(ctx, span.name, left, 415, 39, span.color);
        api.text(ctx, span.ms.toLocaleString('en-US') + ' ms', left, 638, 44, span.color);
        elapsed += span.ms;
      }
      api.text(
        ctx,
        'Combined span duration   ' + elapsed.toLocaleString('en-US') + ' ms',
        x,
        794,
        38,
        C.ink,
      );
    });
    api.focus.target('first-chunk', () =>
      api.text(
        ctx,
        'First visible chunk   /   measure from client request to first displayed output',
        x,
        930,
        35,
        C.muted,
      ),
    );
    return;
  }

  const shifted = at('cache-return') === 1;
  const totalInput = 2000;
  const cached = shifted ? 0 : 1200;
  const counts = [totalInput - cached, cached, 100];
  const rates = [3, 0.3, 9];
  const cost = pricedTokens({ uncached: counts[0], cached, output: counts[2], rates });
  const settled = shifted ? at('second-cost') === 1 : at('first-cost') === 1;
  api.focus.target('buckets', () => {
    api.text(ctx, 'Illustrative rate card   /   dollars per million tokens', 125, 261, 36, C.muted);
    api.text(ctx, 'Token bucket', 125, 371, 30, C.muted);
    api.text(ctx, 'Count', 865, 371, 30, C.muted, 'right');
    api.text(ctx, 'Rate', 1190, 371, 30, C.muted, 'right');
    api.text(ctx, 'Estimated dollars', 1740, 371, 30, C.muted, 'right');
    ['Uncached input', 'Cached input', 'Billed output'].forEach((label, i) => {
      const y = 467 + i * 115;
      api.text(ctx, label, 125, y, 40, C.ink);
      api.text(ctx, counts[i].toLocaleString('en-US'), 865, y, 46, C.cyan, 'right');
      api.text(ctx, '$' + rates[i].toFixed(2), 1190, y, 41, C.ink, 'right');
      api.text(ctx, '$' + (cost.terms[i] / 1e6).toFixed(5), 1740, y, 40, C.ink, 'right');
    });
  });
  api.line(ctx, 125, 753, 1740, 753, C.muted, 2);
  api.focus.target('bill', () => {
    api.text(ctx, 'Same 2,000 input tokens   +   100 billed output tokens', 125, 842, 35, C.ink);
    api.text(ctx, 'Estimated token cost', 125, 951, 42, C.ink);
    api.text(
      ctx,
      settled ? '$' + cost.total.toFixed(5) : '?',
      1740,
      956,
      57,
      settled ? C.green : C.yellow,
      'right',
    );
  });
}
export default {
  id: 'token-cost',
  draw: drawTokenCost,
  cues: [
    'time-spans',
    'first-visible',
    'token-buckets',
    'first-cost',
    'cache-return',
    'second-cost',
    'price-scope',
  ],
};
