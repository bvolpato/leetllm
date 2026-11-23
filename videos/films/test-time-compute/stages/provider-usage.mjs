import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { card, fillStrip, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawProviderUsage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('provider-usage', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  const result = (name, label, x = 960, y = 900, k = themeColors.green, z = 38, beat = 0) =>
    focusTarget(ctx, api, name, () =>
      text(
        ctx,
        api,
        prog(name, beat).done ? label : 'Calculation pending',
        x,
        y,
        z,
        prog(name, beat).done ? k : themeColors.muted,
        'center',
      ),
    );
  function content() {
    if (currentBeat < 2) {
      text(
        ctx,
        api,
        'Inclusive output ledger · exactly two components in this fixture',
        960,
        285,
        33,
        themeColors.muted,
        'center',
      );
      focusTarget(ctx, api, 'tt-usage-components', () => {
        fillStrip(ctx, api, 1, 220, 420, 1460, themeColors.blue, '1400 total output tokens');
        api.rect(ctx, 220, 420, (1460 * 1220) / 1400, 56, themeColors.pink, undefined, 0);
        text(ctx, api, '1220 reasoning · included', 790, 570, 34, themeColors.pink, 'center');
      });
      if (currentBeat === 0)
        result(
          'tt-visible-count',
          '1400 − 1220 = 180 visible tokens',
          960,
          780,
          themeColors.green,
          43,
        );
      else {
        text(ctx, api, 'Total 1400 × $10 / 1,000,000', 960, 720, 40, themeColors.ink, 'center');
        result('tt-output-charge', 'Output charge = $0.014', 960, 880, themeColors.green, 39, 1);
        focusTarget(ctx, api, 'tt-inclusive-once', () => {
          if (prog('tt-inclusive-once', 1).started) {
            text(
              ctx,
              api,
              'Adding 1220 again duplicates the reasoning segment',
              960,
              980,
              29,
              themeColors.pink,
              'center',
            );
          }
        });
      }
    } else {
      card(ctx, api, 'Inclusive endpoint', 190, 320, 630, 115, themeColors.blue);
      card(ctx, api, 'Separate-field endpoint', 1090, 320, 630, 115, themeColors.cyan);
      card(ctx, api, 'total includes reasoning', 190, 510, 630, 100, themeColors.pink);
      card(ctx, api, 'thoughts', 1090, 510, 280, 100, themeColors.pink);
      card(ctx, api, 'output', 1440, 510, 280, 100, themeColors.cyan);
      focusTarget(ctx, api, 'tt-usage-separate', () => {
        const q = prog('tt-usage-separate', 2).p;
        movingCard(ctx, api, 'thoughts', 1145, 645, 1150, 795, q, themeColors.pink);
        movingCard(ctx, api, 'output', 1485, 645, 1360, 795, q, themeColors.cyan);
      });
      text(
        ctx,
        api,
        'Read the selected schema before summing or subtracting',
        960,
        975,
        33,
        themeColors.yellow,
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
  id: 'provider-usage',
  draw: drawProviderUsage,
  cues: [
    'tt-provider-usage-0',
    'tt-usage-components',
    'tt-visible-count',
    'tt-provider-usage-1',
    'tt-output-charge',
    'tt-inclusive-once',
    'tt-provider-usage-2',
    'tt-usage-separate',
  ],
};
