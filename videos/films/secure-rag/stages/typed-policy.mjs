import {
  drawFooter,
  drawHeading,
  drawLine,
  drawRectangle,
  drawTag,
  drawText,
  interpolateScalar,
} from '../defaults.mjs';
export function drawTypedPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-typed-policy-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-typed-policy-mechanism', () => {
    const gates = [
        'tenant = A',
        'is_deleted is False',
        'aware clock + endpoints',
        'start ≤ now < end',
      ],
      q = Q('required', 0);
    drawHeading(ctx, api, 'Mandatory gates precede alternative grants');
    gates.forEach((v, i) => {
      const col = i < Math.ceil(q * 4) ? themeColors.yellow : themeColors.muted;
      drawRectangle(ctx, api, 170 + i * 420, 360, 350, 130, col);
      drawText(
        ctx,
        api,
        v,
        345 + i * 420,
        435,
        26,
        col,
        'center',
        v.includes('_') ? 'mono' : 'sans',
      );
    });
    if (currentBeat === 0 && resultComplete('deny', 0)) {
      drawTag(ctx, api, 'Malformed required field', 'DENY row', 650, 650, 650, themeColors.pink);
    }
    if (currentBeat === 1) {
      const x = 300,
        w = 1300,
        start = 10,
        end = 20,
        now = interpolateScalar(ctx, api, 10, 20, Q('interval', 1));
      drawLine(ctx, api, x, 700, x + w, 700, themeColors.muted);
      [10, 15, 20].forEach((v) => {
        const z = x + ((v - start) / (end - start)) * w;
        drawLine(ctx, api, z, 682, z, 718, themeColors.muted);
        drawText(ctx, api, v, z, 765, 27, themeColors.muted, 'center');
      });
      drawLine(ctx, api, x, 700, x + w, 700, themeColors.green);
      api.rect(
        ctx,
        x + ((now - start) / (end - start)) * w - 7,
        683,
        14,
        34,
        themeColors.yellow,
        themeColors.yellow,
        2,
      );
      drawText(ctx, api, 'inclusive start', x, 620, 28, themeColors.green);
      drawText(ctx, api, 'exclusive end', x + w, 620, 28, themeColors.pink, 'right');
      if (resultComplete('expiry', 1))
        drawText(ctx, api, 'now = end → DENY', 960, 895, 34, themeColors.pink, 'center');
    }
    if (currentBeat === 2) {
      const names = ['public', 'owner', 'department', 'explicit user', 'group', 'role'];
      names.forEach((n, i) => {
        const q = Q('or', 2),
          y = 590 + (i % 3) * 110,
          x = i < 3 ? 250 : 1050;
        drawRectangle(
          ctx,
          api,
          x,
          y,
          570,
          76,
          q * 6 >= i + 1 ? themeColors.green : themeColors.muted,
        );
        drawText(
          ctx,
          api,
          n,
          x + 25,
          y + 48,
          27,
          q * 6 >= i + 1 ? themeColors.green : themeColors.muted,
        );
      });
      drawText(
        ctx,
        api,
        'Any granted alternative, after ALL mandatory gates',
        960,
        930,
        29,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Local toy policy: explicit null endpoints are unbounded; missing, string or naive time inputs deny.',
    );
  });
}
export default {
  id: 'typed-policy',
  draw: drawTypedPolicy,
  cues: [
    'sr-typed-policy-0',
    'sr-typed-policy-required',
    'sr-typed-policy-deny',
    'sr-typed-policy-1',
    'sr-typed-policy-interval',
    'sr-typed-policy-expiry',
    'sr-typed-policy-2',
    'sr-typed-policy-or',
  ],
};
