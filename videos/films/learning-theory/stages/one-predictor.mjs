import { hoeffdingRadius, repeatedErrors } from '../fixtures.mjs';
import { fixedSampleCollection } from '../model.mjs';
import { axis, equation, interval, line, text, ticket } from '../defaults.mjs';
export function drawOnePredictor(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0);
  const phase = (beat, start = 0.12, end = 0.72) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress2, start, end);
  const main = () => {
    const x = 410,
      width = 1180,
      risk = 0.2,
      visible = Math.max(1, Math.ceil(phase(2, 0.04, 0.84) * repeatedErrors.length));
    const map = axis(ctx, api, x, 890, width, 0.8, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    line(ctx, api, map(risk), 320, map(risk), 875, themeColors.green, 4);
    text(ctx, api, 'Fixed toy risk 0.20', map(risk), 282, 33, themeColors.green, 'center');
    if (currentBeat === 0) {
      const sample = fixedSampleCollection(phase(0, 0.05, 0.9));
      sample.losses.forEach((loss, i) =>
        ticket(ctx, api, i, 260 + (i % 10) * 50, 350 + Math.floor(i / 10) * 50, loss === 1, 40),
      );
      text(
        ctx,
        api,
        'Sample S1 · predictor fixed before collection',
        1320,
        625,
        29,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        `Scored ${sample.count}/40 tickets · ${sample.errors} wrong routes`,
        1320,
        690,
        32,
        themeColors.cyan,
        'center',
      );
      if (sample.complete) {
        text(ctx, api, 'S1 · 4/40', 110, 760, 27, themeColors.muted);
        interval(ctx, api, x, 750, width, 0.1, 0, themeColors.yellow, 0.8);
        text(ctx, api, 'Empirical risk 4/40 = 0.100', 1320, 820, 32, themeColors.yellow, 'center');
      }
      text(
        ctx,
        api,
        'Each numbered ticket contributes one bounded loss',
        960,
        995,
        30,
        themeColors.muted,
        'center',
      );
      return;
    }
    repeatedErrors.slice(0, visible).forEach((k, i) => {
      const y = 340 + i * 44;
      text(ctx, api, `S${i + 1} · ${k}/40`, 110, y + 10, 27, themeColors.muted);
      interval(
        ctx,
        api,
        x,
        y,
        width,
        k / 40,
        hoeffdingRadius(40) * phase(1),
        Math.abs(k / 40 - risk) > hoeffdingRadius(40)
          ? themeColors.pink
          : i === 0
            ? themeColors.yellow
            : themeColors.cyan,
        0.8,
      );
    });
    const covered = repeatedErrors
      .slice(0, visible)
      .filter((k) => Math.abs(k / 40 - risk) <= hoeffdingRadius(40)).length;
    text(
      ctx,
      api,
      currentBeat === 1 && phase(1) < 1
        ? 'S1 interval in construction · final coverage check pending'
        : `${covered}/${visible} example intervals cover the fixed risk`,
      960,
      965,
      30,
      themeColors.muted,
      'center',
    );
    if (phase(1) >= 1)
      equation(
        ctx,
        api,
        String.raw`\epsilon=\sqrt{\frac{\log(2/0.05)}{2\cdot40}}\approx0.215\quad0.100+\epsilon\approx0.315`,
        960,
        1025,
        35,
        themeColors.yellow,
      );
    else
      text(
        ctx,
        api,
        'Construct the 95% band from forty bounded losses',
        960,
        1025,
        30,
        themeColors.yellow,
        'center',
      );
  };
  // The cue target is the actual spatial construction for this scene.
  if (api.focus) api.focus.target(`${'one-predictor'}-construction`, main);
  else main();
}
export default {
  id: 'one-predictor',
  draw: drawOnePredictor,
  cues: ['one-predictor-voice-1', 'one-predictor-voice-2', 'one-predictor-voice-3'],
};
