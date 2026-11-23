import { phraseEnded, phraseProgress } from '../arithmetic.mjs';
import { hidden, secondContext, tokens } from '../fixtures.mjs';
import { outputProjection, projectContext } from '../model.mjs';
import { text } from '../defaults.mjs';

export function drawPrefillDecode(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const first = outputProjection();
  const second = projectContext(secondContext);
  const appended = b > 0;
  const processed = b > 2 || (b === 2 && phraseEnded(state, 'docs-read', 0.1));
  const newState = b > 2 || (b === 2 && phraseEnded(state, 'supply-vector', 0.5));
  const selected = b > 2 || (b === 2 && phraseEnded(state, 'second-pick', 0.72));
  const filled = b > 0 || phraseProgress(state, 'prefill-store', 0.23, 0.6) >= 1;
  const rows = [...tokens, first.selected, second.selected];
  const count = filled ? tokens.length + Number(processed) : 0;
  const printed = tokens.length + Number(appended) + Number(selected);
  const x = (i) => 515 + i * 204;
  text(ctx, api, 'Text', 200, 390, 38, C.ink);
  text(ctx, api, 'Cache', 200, 565, 38, C.green);
  text(ctx, api, 'One layer', 200, 614, 27, C.muted);
  rows.forEach((token, i) => {
    const color = i >= tokens.length ? C.yellow : C.blue;
    api.line(ctx, x(i) - 78, 425, x(i) + 78, 425, C.muted, 2);
    if (i < printed) text(ctx, api, token, x(i), 395, 49, color, 'center');
    api.focus.target(i === 4 ? 'docs-slot' : 'cache-slot-' + i, () => {
      api.rect(ctx, x(i) - 75, 510, 150, 94, C.panel, i < count ? C.green : C.muted, 5);
      text(
        ctx,
        api,
        i < count ? 'K   V' : '·',
        x(i),
        572,
        38,
        i < count ? C.green : C.muted,
        'center',
      );
    });
  });
  api.focus.target('cache-count', () =>
    text(
      ctx,
      api,
      printed + ' text positions     /     ' + count + ' cached positions',
      960,
      708,
      34,
      C.ink,
      'center',
    ),
  );
  const projection = newState ? second : first;
  const h = newState ? secondContext : hidden;
  api.focus.target('last-row', () => {
    if (b === 0) {
      text(
        ctx,
        api,
        'One projection matrix across four prompt rows',
        960,
        858,
        40,
        C.blue,
        'center',
      );
    } else if (b < 3) {
      text(
        ctx,
        api,
        'Last row   [' + h.map((v) => v.toFixed(1)).join(', ') + ']',
        280,
        857,
        39,
        C.blue,
      );
      text(ctx, api, 'Docs   ' + projection.logits[0].toFixed(2), 958, 857, 43);
      text(ctx, api, 'Period   ' + projection.logits[1].toFixed(2), 1360, 857, 43);
      text(
        ctx,
        api,
        selected
          ? 'Complete reply   “' + first.selected + second.selected + '”'
          : 'Two leading scores  ·  same four output rows',
        960,
        964,
        30,
        C.muted,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'One new row per request at each decode step',
        960,
        858,
        40,
        C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'prefill-decode',
  draw: drawPrefillDecode,
  cues: [
    'prefill-store',
    'waiting-slot',
    'docs-read',
    'supply-vector',
    'second-pick',
    'decode-rows',
  ],
};
