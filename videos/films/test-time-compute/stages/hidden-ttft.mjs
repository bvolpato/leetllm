import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { focusTarget, text } from '../defaults.mjs';
export function drawHiddenTtft(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('hidden-ttft', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    text(
      ctx,
      api,
      '80 hidden tokens/s · other delay 180 ms',
      960,
      285,
      39,
      themeColors.ink,
      'center',
    );
    const counts = [128, 512];
    counts.forEach((n, i) => {
      const y = 400 + i * 230,
        show = currentBeat >= 1,
        cue = i ? m.long : m.short;
      if (!show && i) return;
      text(ctx, api, `${n} cap`, 180, y + 40, 32, themeColors.blue);
      const q = show ? cue.p : 0;
      const scale = 1000 / 7000,
        other = 180 * scale,
        w = (n / 80) * 1000 * scale;
      api.rect(ctx, 470, y, other, 65, themeColors.yellow, undefined, 0);
      api.rect(
        ctx,
        470 + other,
        y,
        Math.max(1, w * (cue.done ? 1 : Math.min(0.99, q))),
        65,
        themeColors.pink,
        undefined,
        0,
      );
      focusTarget(ctx, api, i ? 'tt-clock-long' : 'tt-clock-short', () =>
        text(
          ctx,
          api,
          cue.done ? `${m.totals[i]} ms` : 'clock running',
          1660,
          y + 45,
          35,
          cue.done
            ? prog('tt-clock-service-verdict', 1).done
              ? i
                ? themeColors.pink
                : themeColors.green
              : themeColors.cyan
            : themeColors.muted,
          'center',
        ),
      );
    });
    if (currentBeat >= 1)
      focusTarget(ctx, api, 'tt-clock-service-verdict', () =>
        text(
          ctx,
          api,
          prog('tt-clock-service-verdict', 1).done
            ? '3000 ms limit · 128 fits; 512 exceeds'
            : 'Service comparison pending',
          960,
          815,
          34,
          prog('tt-clock-service-verdict', 1).done ? themeColors.yellow : themeColors.muted,
          'center',
        ),
      );
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Co-tenant decode slots are capacity too',
        960,
        920,
        38,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Goodput counts qualified completions / wall-clock second',
        960,
        1000,
        31,
        themeColors.cyan,
        'center',
      );
    }
  }
  // Existing manuscript operation targets remain attached to the actual construction.
  const bases = scene.beats.flatMap((beat) =>
    (beat.visual_cues ?? [])
      .filter((cue) => /^tt-[a-z].*-\d+$/.test(cue.id))
      .flatMap((cue) => cue.targets ?? []),
  );
  const wrap = (i) =>
    i < bases.length ? focusTarget(ctx, api, bases[i], () => wrap(i + 1)) : content();
  wrap(0);
}
export default {
  id: 'hidden-ttft',
  draw: drawHiddenTtft,
  cues: [
    'tt-hidden-ttft-0',
    'tt-hidden-ttft-1',
    'tt-clock-short',
    'tt-clock-long',
    'tt-clock-service-verdict',
    'tt-hidden-ttft-2',
  ],
};
