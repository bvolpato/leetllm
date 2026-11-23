import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { card, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawWorkLedger(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('work-ledger', state);
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
    const work = prog(
        currentBeat === 0
          ? 'tt-queued-work'
          : currentBeat === 1
            ? 'tt-paid-work'
            : 'tt-release-state',
        currentBeat,
      ),
      q = work.p;
    if (currentBeat === 0) {
      text(ctx, api, 'Eight candidate identities', 960, 285, 38, themeColors.blue, 'center');
      for (let i = 0; i < 8; i++) {
        const x = 250 + (i % 4) * 400,
          y = i < 4 ? 400 : 570;
        focusTarget(ctx, api, 'tt-queued-work', () => {
          const dest = x;
          movingCard(
            ctx,
            api,
            `C${i + 1}`,
            x,
            y,
            dest,
            i < 4 ? 610 : 800,
            q,
            i < 4 ? themeColors.blue : themeColors.muted,
          );
        });
      }
      text(
        ctx,
        api,
        'Illustrative four execution slots · remaining identities wait',
        960,
        980,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const names = ['initial draft', 'critique', 'rewrite', 'critique', 'rewrite'];
      names.forEach((s, i) =>
        card(
          ctx,
          api,
          s,
          140 + i * 350,
          470,
          270,
          100,
          i % 2 ? themeColors.yellow : themeColors.blue,
          27,
        ),
      );
      result(
        'tt-paid-work',
        'Generation calls = 1 + 2 × later revisions',
        960,
        840,
        themeColors.cyan,
        38,
        1,
      );
      text(
        ctx,
        api,
        'The round that discovers a plateau has already been paid',
        960,
        980,
        32,
        themeColors.pink,
        'center',
      );
    } else {
      card(ctx, api, 'SPENT', 160, 320, 440, 95, themeColors.yellow, 35);
      card(ctx, api, 'RETAINED', 740, 320, 440, 95, themeColors.blue, 35);
      card(ctx, api, 'RETURNED', 1320, 320, 440, 95, themeColors.green, 35);
      text(ctx, api, 'generated + checked', 380, 500, 29, themeColors.yellow, 'center');
      text(ctx, api, 'live cache owners', 960, 500, 29, themeColors.blue, 'center');
      text(ctx, api, 'one checked answer', 1540, 500, 29, themeColors.green, 'center');
      for (let i = 0; i < 4; i++) {
        card(ctx, api, `C${i + 1}`, 200 + i * 80, 650, 65, 70, themeColors.yellow, 23);
        if (i < 3)
          focusTarget(ctx, api, 'tt-release-state', () =>
            components.fade(i === 1 ? 1 - q : 1, () =>
              card(ctx, api, `C${i + 1}`, 790 + i * 110, 650, 80, 70, themeColors.blue, 24),
            ),
          );
      }
      card(ctx, api, 'C3', 1450, 650, 180, 85, themeColors.green, 33);
      text(
        ctx,
        api,
        'Memory release changes retained state · spent work remains',
        960,
        960,
        34,
        themeColors.ink,
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
  id: 'work-ledger',
  draw: drawWorkLedger,
  cues: [
    'tt-work-ledger-0',
    'tt-queued-work',
    'tt-work-ledger-1',
    'tt-paid-work',
    'tt-work-ledger-2',
    'tt-release-state',
  ],
};
