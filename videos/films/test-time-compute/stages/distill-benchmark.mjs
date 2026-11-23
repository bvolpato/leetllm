import { sceneClock } from '../scene-clock.mjs';
import { focusTarget, text } from '../defaults.mjs';
export function drawDistillBenchmark(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cue = sceneClock(scene, state);
  function content() {
    text(
      ctx,
      api,
      'AIME 2024 math problems  ·  estimated pass@1',
      960,
      280,
      35,
      themeColors.muted,
      'center',
    );
    const values = [28.9, 55.5, 72.6, 79.8],
      labels = ['Qwen student 1.5B', 'Qwen student 7B', 'Qwen student 32B', 'Full R1'];
    const results = [
      'tt-student-results',
      'r1-seven-billion',
      'r1-thirty-two-billion',
      'tt-r1-result',
    ];
    values.forEach((v, i) => {
      if (i === 3 && currentBeat === 0) return;
      const y = 380 + i * 140,
        result = cue(results[i]);
      text(ctx, api, labels[i], 180, y + 35, 29, i === 3 ? themeColors.pink : themeColors.blue);
      focusTarget(ctx, api, results[i], () => {
        api.line(ctx, 600, y + 28, 1500, y + 28, themeColors.muted, 2);
        if (result.p > 0) {
          api.rect(
            ctx,
            600,
            y,
            (900 * v * result.p) / 100,
            55,
            i === 3 ? themeColors.pink : themeColors.blue,
            undefined,
            0,
          );
        }
        if (result.done) text(ctx, api, `${v}%`, 1580, y + 40, 35, themeColors.ink, 'center');
      });
    });
    if (currentBeat >= 1)
      text(
        ctx,
        api,
        'temperature 0.6 · top-p 0.95 · estimated pass@1',
        960,
        1000,
        31,
        themeColors.yellow,
        'center',
      );
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
  id: 'distill-benchmark',
  draw: drawDistillBenchmark,
  cues: [
    'tt-distill-benchmark-0',
    'tt-student-results',
    'tt-distill-benchmark-1',
    'tt-r1-result',
    'tt-distill-benchmark-2',
  ],
};
