import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawSearchCompletion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('search-completion', state);
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
    const q = prog('tt-pool-transfer', 0).p;
    text(ctx, api, 'ACTIVE · unfinished prefixes', 500, 275, 35, themeColors.blue, 'center');
    text(ctx, api, 'COMPLETED · final syntax', 1430, 275, 35, themeColors.green, 'center');
    api.rect(ctx, 160, 340, 680, 405, null, themeColors.blue, 12);
    api.rect(ctx, 1080, 340, 680, 405, null, themeColors.green, 12);
    if (currentBeat === 0) {
      card(ctx, api, 'prefix', 240, 420, 350, 95, themeColors.blue);
      focusTarget(ctx, api, 'tt-pool-transfer', () =>
        movingCard(ctx, api, 'FINAL: …', 300, 580, 1260, 580, q, themeColors.green),
      );
    } else {
      card(ctx, api, 'unfinished · score 0.9', 235, 470, 530, 100, themeColors.blue);
      card(ctx, api, 'final · score 0.8', 1155, 470, 530, 100, themeColors.green);
      if (currentBeat === 1) {
        result(
          'tt-completed-return',
          'Budget ends → return best completed',
          960,
          995,
          themeColors.green,
          36,
          1,
        );
        if (prog('tt-completed-return', 1).done) {
          card(
            ctx,
            api,
            'Returned completed chain · 0.8',
            650,
            810,
            620,
            100,
            themeColors.green,
            31,
          );
          arrow(ctx, api, 1430, 775, 1300, 855, themeColors.green);
        }
      }
    }
    if (currentBeat === 2) {
      card(
        ctx,
        api,
        'Parser recognizes syntax · task verifier checks truth',
        340,
        815,
        1240,
        105,
        themeColors.yellow,
        32,
      );
      text(
        ctx,
        api,
        'Reject malformed / non-finite scores before ranking',
        960,
        1000,
        32,
        themeColors.pink,
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
  id: 'search-completion',
  draw: drawSearchCompletion,
  cues: [
    'tt-search-completion-0',
    'tt-pool-transfer',
    'tt-search-completion-1',
    'tt-completed-return',
    'tt-search-completion-2',
  ],
};
