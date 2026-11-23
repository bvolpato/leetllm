import { sampleSlimeChapter } from '../construction.mjs';
import { progress } from '../phrase-clock.mjs';

const xs = [556, 1062, 1568];
const values = (s) =>
  [s.weight, s.velocity].map((v) => String(Number(v.toFixed(4))).replace('-', '−'));
function pair(ctx, api, x, y, state, color, placeholder) {
  api.rect(ctx, x - 184, y - 65, 368, 109, api.C.panel, color, 9);
  if (!state) {
    api.text(ctx, placeholder, x, y + 4, 35, color, 'center');
    return;
  }
  const [w, v] = values(state);
  api.text(ctx, 'w  ' + w, x, y - 19, 36, color, 'center');
  api.text(ctx, 'v  ' + v, x, y + 26, 36, color, 'center');
}

export function drawFreshReplay(ctx, scene, state, api) {
  const { C } = api;
  const s = sampleSlimeChapter('fresh-replay', state, scene);
  const p = (b, i) => progress(scene, state, `sl-fresh-replay-b${b}-s${i}`);
  const recovered = state.beat === 2 && s.count >= 1;
  const skipVisible = state.beat === 1 && s.skipReady;
  return api.focus.target('replay-fork', () => {
    api.text(ctx, 'v′ = 0.9v + g', 145, 285, 44, C.ink);
    api.text(ctx, 'w′ = w − 0.2v′', 801, 285, 44, C.ink);
    api.text(ctx, 'Fixed gradients', 1785, 285, 30, C.muted, 'right');
    api.line(ctx, 136, 321, 1785, 321, C.muted, 2);
    ['Checkpoint 20', 'Batch 21', 'Batch 22'].forEach((label, i) => {
      api.text(ctx, label, xs[i], 407, 38, i ? C.blue : C.yellow, 'center');
      const seen = i > 0 && p(0, 3) > 0;
      if (seen)
        api.text(
          ctx,
          'g = ' + (s.reference[i].gradient < 0 ? '−' : '+') + Math.abs(s.reference[i].gradient),
          xs[i],
          460,
          34,
          C.ink,
          'center',
        );
    });
    api.text(ctx, 'Original run', 110, 576, 36, C.blue);
    api.text(ctx, 'From disk', 110, 776, 36, C.cyan);
    const reference = [
      s.start,
      s.firstReady ? s.reference[1] : null,
      s.finalReady ? s.reference[2] : null,
    ];
    const restored = [
      s.start,
      recovered ? s.reference[1] : null,
      state.beat === 2 && s.count === 2 ? s.current : skipVisible ? s.skipped[1] : null,
    ];
    for (let i = 0; i < xs.length; i++) {
      if (i > 0) {
        api.arrow(ctx, xs[i - 1] + 192, 557, xs[i] - 193, 557, C.blue, 3);
        if (recovered && i <= s.count)
          api.arrow(ctx, xs[i - 1] + 192, 755, xs[i] - 193, 755, C.cyan, 3);
      }
      pair(ctx, api, xs[i], 567, reference[i], C.blue, p(0, 3) === 1 ? 'finished' : '·');
      const missing = i === 1 && !recovered && p(0, 4) > 0;
      const placeholder = missing
        ? 'batch missing'
        : i === 2 && p(0, 4) > 0
          ? 'batch retained'
          : '·';
      const color = missing
        ? C.yellow
        : skipVisible && i === 2
          ? C.pink
          : restored[i]
            ? C.cyan
            : C.muted;
      pair(ctx, api, xs[i], 767, restored[i], color, placeholder);
    }
    if (skipVisible) {
      api.path(
        ctx,
        [
          { x: xs[0], y: 817 },
          { x: xs[0], y: 853 },
          { x: xs[2], y: 853 },
        ],
        { color: C.pink, width: 4 },
      );
      api.arrow(ctx, xs[2], 853, xs[2], 819, C.pink, 4);
    }
    let footer = 'Two runs start with the same weight and velocity.';
    if (p(0, 5) > 0 && !s.skipReady)
      footer = 'Can the lower run use batch 22 alone and then continue with 23?';
    if (state.beat === 1 && s.skipReady)
      footer = s.finalReady
        ? 'Hold batch 23. The two runs reached different optimizer states.'
        : s.firstReady
          ? 'Original run: 0.9 × 0.39 − 0.4 = −0.049'
          : 'Shortcut: 0.9 × 0.1 − 0.4 = −0.31';
    if (state.beat === 2) {
      footer = 'Restore batch 21, then apply batch 22 to its result.';
      if (s.repaired) footer = 'Both the weight and the velocity match.';
      if (p(2, 2) > 0) footer = 'On the real run, compare the first resumed update.';
      if (p(2, 3) > 0) footer = 'Next fresh batch: 23';
    }
    api.text(
      ctx,
      footer,
      960,
      971,
      38,
      s.repaired ? C.green : state.beat === 0 ? C.yellow : C.ink,
      'center',
    );
  });
}
export default {
  id: 'fresh-replay',
  draw: drawFreshReplay,
  cues: [
    ...[6, 5, 4].flatMap((count, b) =>
      Array.from({ length: count }, (_, i) => `sl-fresh-replay-b${b}-s${i}`),
    ),
    'replay-original-first',
    'replay-original-second',
  ],
};
