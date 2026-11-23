import { servingWindow } from '../arithmetic.mjs';
import {
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintLargeWindowTail(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  const w = servingWindow(10000, 5714),
    X = (i) => 210 + (i / 10000) * 1500;
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Same 10,000 request window · 5,714 hits at 20 ms; 4,286 misses at 1,020 ms',
    245,
  );
  api.rect(ctx, X(0), 415, X(5714) - X(0), 130, themeColors.blue);
  api.rect(ctx, X(5714), 415, X(10000) - X(5714), 130, themeColors.pink);
  drawSemanticConstructionsText(
    ctx,
    api,
    themeColors,
    'safe hits',
    X(2857),
    490,
    32,
    themeColors.ink,
    'center',
  );
  drawSemanticConstructionsText(
    ctx,
    api,
    themeColors,
    'fresh generations',
    X(7857),
    490,
    31,
    themeColors.ink,
    'center',
  );
  drawSemanticConstructionsText(ctx, api, themeColors, '1', X(0), 620, 27, themeColors.muted);
  drawSemanticConstructionsText(
    ctx,
    api,
    themeColors,
    '5,714',
    X(5714),
    620,
    27,
    themeColors.muted,
    'center',
  );
  drawSemanticConstructionsText(
    ctx,
    api,
    themeColors,
    '10,000',
    X(10000),
    620,
    27,
    themeColors.muted,
    'right',
  );
  if (done(0, 'sc-large-mean'))
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      '(5,714 × 20 + 4,286 × 1,020) / 10,000 = 448.6 ms',
      750,
      themeColors.cyan,
      34,
    );
  if (currentBeat === 1 && done(1, 'sc-tail-rank')) {
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      X(w.rank),
      340,
      X(w.rank),
      575,
      themeColors.yellow,
      4,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'rank 9,500',
      X(w.rank),
      305,
      31,
      themeColors.yellow,
      'center',
    );
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Nearest-rank p95 = 1,020 ms · no-cache baseline = 1,000 ms',
      900,
      themeColors.pink,
      34,
    );
  }
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Sort request latencies over the declared full window; an improved mean can coexist with a slower tail',
  );
}
export function drawLargeWindowTail(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintLargeWindowTail);
}
export default {
  id: 'large-window-tail',
  draw: drawLargeWindowTail,
  cues: ['sc-large-window-tail-b0', 'sc-large-mean', 'sc-large-window-tail-b1', 'sc-tail-rank'],
};
