import { mpClamp } from '../arithmetic.mjs';
import { parallelArrow, parallelFooter, parallelRectangle, parallelText } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawStartupPayload(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-startup-payload-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-startup-payload-mechanism', () => {
    if (currentBeat === 0) {
      const q = Q('calls', 0);
      for (let i = 0; i < 160; i++) {
        const x = 180 + (i % 40) * 38,
          y = 390 + Math.floor(i / 40) * 90;
        parallelRectangle(
          ctx,
          api,
          x,
          y,
          29,
          62,
          i < q * 160 ? themeColors.blue : themeColors.muted,
          i < q * 160 ? themeColors.blue : themeColors.bg,
        );
      }
      parallelText(ctx, api, '160 calls starting one after another', 180, 300, 38);
      parallelText(
        ctx,
        api,
        resultComplete('startup', 0)
          ? '5 µs → 0.8 ms     20 µs → 3.2 ms'
          : 'per-call assumptions: 5 µs / 20 µs',
        960,
        840,
        34,
        themeColors.yellow,
        'center',
      );
      if (resultComplete('baseline', 0))
        parallelText(
          ctx,
          api,
          '6 + 3.2 = 9.2 ms · +53.3%',
          960,
          940,
          33,
          themeColors.pink,
          'center',
        );
    } else {
      parallelText(ctx, api, 'Bytes sent by each GPU in a four-GPU ring', 180, 300, 37);
      const q = Q('activation', 1);
      for (let r = 0; r < 4; r++) {
        const x = 200 + r * 420;
        parallelRectangle(ctx, api, x, 440, 330, 145, themeColors.blue);
        parallelText(ctx, api, 'rank ' + r, x + 165, 495, 30, themeColors.blue, 'center');
        parallelText(
          ctx,
          api,
          resultComplete('activation', 1) ? '8 × 4096 × 2 B' : 'activation bytes: ?',
          x + 165,
          550,
          25,
          themeColors.cyan,
          'center',
        );
        if (q > 0 && r < 3) parallelArrow(ctx, api, x + 340, 510, x + 395, 510, themeColors.cyan);
      }
      if (resultComplete('send', 1))
        parallelText(
          ctx,
          api,
          '64 KiB × (¾ + ¾) = 96 KiB sent per rank per call',
          960,
          740,
          32,
          themeColors.yellow,
          'center',
        );
      if (currentBeat === 2 && resultComplete('payload', 2))
        parallelText(
          ctx,
          api,
          '160 × 96 KiB ÷ 300 GB/s ≈ 0.0524 ms',
          960,
          895,
          34,
          themeColors.green,
          'center',
        );
    }
    parallelFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Startup time = number of calls × time per start'
        : 'Ring traffic factor per rank = 2 × (TP − 1) / TP',
    );
  });
}
export default {
  id: 'startup-payload',
  draw: drawStartupPayload,
  cues: [
    'mp-startup-payload-0',
    'mp-startup-payload-calls',
    'mp-startup-payload-startup',
    'mp-startup-payload-baseline',
    'mp-startup-payload-1',
    'mp-startup-payload-activation',
    'mp-startup-payload-send',
    'mp-startup-payload-2',
    'mp-startup-payload-payload',
  ],
};
