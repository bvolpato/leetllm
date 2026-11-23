import { cueVisible, evidenceBox, evidenceHold, evidenceLine, evidenceText } from '../defaults.mjs';
export function drawHarnessIntegrity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  api.focus.target('harness-integrity-mechanism', () => {
    if (currentBeat === 0) {
      const reset = cueVisible(ctx, api, 'reset-remote');
      const cleared = cueVisible(ctx, api, 'reset-approval');
      evidenceText(
        ctx,
        api,
        'Restoring a container leaves remote effects behind',
        960,
        290,
        34,
        themeColors.ink,
        'center',
      );
      evidenceHold(ctx, api, 1160, 350, reset ? 2 : 3, 'B7', reset ? 0 : 1);
      evidenceBox(
        ctx,
        api,
        'Agent sandbox\nprocess + local files',
        220,
        350,
        670,
        140,
        themeColors.blue,
      );
      evidenceBox(
        ctx,
        api,
        cleared ? 'Memory/cache cleared' : 'Memory: prior approval',
        220,
        570,
        670,
        110,
        cleared ? themeColors.green : themeColors.yellow,
      );
      evidenceBox(
        ctx,
        api,
        reset ? 'Remote B7 state restored' : 'Remote hold still exists',
        1160,
        770,
        470,
        90,
        reset ? themeColors.green : themeColors.yellow,
      );
      if (cueVisible(ctx, api, 'reset-approval'))
        evidenceText(
          ctx,
          api,
          'Prior call-bound approval invalidated',
          960,
          915,
          34,
          themeColors.pink,
          'center',
        );
    } else if (currentBeat === 1) {
      api.rect(ctx, 200, 300, 700, 570, themeColors.panel, themeColors.yellow, 15);
      api.rect(ctx, 1040, 300, 680, 570, themeColors.panel, themeColors.green, 15);
      evidenceText(
        ctx,
        api,
        'Candidate-readable / writable',
        550,
        360,
        31,
        themeColors.yellow,
        'center',
      );
      evidenceText(
        ctx,
        api,
        'Independent trusted boundary',
        1380,
        360,
        31,
        themeColors.green,
        'center',
      );
      const protectedGold = cueVisible(ctx, api, 'protect-gold'),
        protectedDeps = cueVisible(ctx, api, 'protect-deps');
      evidenceBox(
        ctx,
        api,
        'gold answers',
        protectedGold ? 1110 : 270,
        450,
        540,
        105,
        protectedGold ? themeColors.green : themeColors.pink,
      );
      evidenceBox(
        ctx,
        api,
        'verifier dependencies',
        protectedDeps ? 1110 : 270,
        620,
        540,
        105,
        protectedDeps ? themeColors.green : themeColors.pink,
      );
      evidenceLine(ctx, api, 970, 305, 970, 880, themeColors.pink, 5);
      evidenceText(
        ctx,
        api,
        'Filesystem · network · tools · identities',
        960,
        930,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      const inside = cueVisible(ctx, api, 'path-inside'),
        outside = cueVisible(ctx, api, 'path-outside'),
        links = cueVisible(ctx, api, 'symlink-limit');
      api.rect(ctx, 240, 330, 1430, 210, themeColors.panel, themeColors.yellow, 12);
      evidenceText(ctx, api, '/sandbox/agent', 280, 380, 30, themeColors.yellow);
      if (inside)
        evidenceBox(
          ctx,
          api,
          'expected.json · readable gold → REJECT',
          300,
          415,
          1280,
          100,
          themeColors.pink,
        );
      if (outside)
        evidenceBox(
          ctx,
          api,
          '/harness/gold/expected.json → lexical check passes',
          240,
          600,
          1430,
          130,
          themeColors.green,
        );
      if (links) {
        evidenceLine(ctx, api, 950, 480, 950, 600, themeColors.pink, 4);
        evidenceText(
          ctx,
          api,
          'Check where the link resolves',
          960,
          840,
          37,
          themeColors.pink,
          'center',
        );
      }
      evidenceText(
        ctx,
        api,
        'Check file access and remote account access under the candidate’s identity.',
        960,
        925,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'harness-integrity',
  draw: drawHarnessIntegrity,
  cues: [
    'reset-remote',
    'reset-approval',
    'protect-gold',
    'protect-deps',
    'path-inside',
    'path-outside',
    'symlink-limit',
  ],
};
