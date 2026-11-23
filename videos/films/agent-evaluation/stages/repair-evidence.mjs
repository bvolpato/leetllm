import {
  cueProgress,
  cueVisible,
  evidenceBox,
  evidenceFootnote,
  evidenceLane,
  evidenceText,
} from '../defaults.mjs';
export function drawRepairEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    resultComplete = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : cueProgress(ctx, api, id) === 1;
  api.focus.target('repair-evidence-mechanism', () => {
    if (currentBeat === 0) {
      const repaired = cueVisible(ctx, api, 'repair-action'),
        pass = resultComplete('repair-passes'),
        cost = resultComplete('repair-cost-result'),
        variants = cueVisible(ctx, api, 'repair-variants'),
        nan = cueVisible(ctx, api, 'repair-nan');
      evidenceLane(
        ctx,
        api,
        ['lookup', repaired ? 'open security\nreview' : 'forbidden\npromotion', 'verify state'],
        345,
        [themeColors.blue, repaired ? themeColors.green : themeColors.pink, themeColors.green],
        cueProgress(ctx, api, 'repair-action'),
      );
      evidenceText(
        ctx,
        api,
        'Same regression task · same scorer',
        960,
        285,
        34,
        themeColors.ink,
        'center',
      );
      if (pass)
        evidenceBox(ctx, api, '3 / 3 regression rows pass', 260, 570, 630, 120, themeColors.green);
      if (cost)
        evidenceBox(
          ctx,
          api,
          'Repaired-row cost $0.061 ≤ $0.08',
          1030,
          570,
          630,
          120,
          themeColors.green,
        );
      if (variants) {
        const resultReady = resultComplete('repair-variants-result');
        evidenceBox(
          ctx,
          api,
          resultReady ? 'Wrong order → FAIL' : 'Wrong-order check pending',
          220,
          760,
          440,
          100,
          resultReady ? themeColors.pink : themeColors.muted,
        );
        if (cueVisible(ctx, api, 'repair-overbudget-input'))
          evidenceBox(
            ctx,
            api,
            resultReady ? '$0.09 cost → FAIL' : '$0.09 cost check pending',
            740,
            760,
            440,
            100,
            resultReady ? themeColors.pink : themeColors.muted,
          );
        if (nan)
          evidenceBox(
            ctx,
            api,
            resultReady ? 'NaN cost → INVALID' : 'NaN cost check pending',
            1260,
            760,
            440,
            100,
            resultReady ? themeColors.pink : themeColors.muted,
          );
      }
    } else {
      evidenceBox(
        ctx,
        api,
        'Known attack case\nrepaired dictionary',
        260,
        330,
        620,
        145,
        themeColors.green,
      );
      evidenceBox(
        ctx,
        api,
        'Untouched task pool\nindependent execution required',
        1050,
        330,
        620,
        145,
        themeColors.yellow,
      );
      const count = resultComplete('repair-not-trial') ? 0 : '?';
      evidenceText(
        ctx,
        api,
        'New independent agent trials: ' + count,
        960,
        615,
        45,
        count ? themeColors.yellow : themeColors.pink,
        'center',
      );
      if (cueVisible(ctx, api, 'new-trials')) {
        for (let i = 0; i < 8; i++) {
          api.circle(ctx, 510 + i * 125, 800, 25, themeColors.panel, themeColors.cyan, 3);
          evidenceText(ctx, api, '?', 510 + i * 125, 811, 32, themeColors.cyan, 'center');
        }
        evidenceText(
          ctx,
          api,
          'New run IDs alone do not create new outcomes',
          960,
          920,
          32,
          themeColors.muted,
          'center',
        );
      }
    }
    evidenceFootnote(ctx, api, 'A failure used to choose the repair is now development evidence');
  });
  return;
}
export default {
  id: 'repair-evidence',
  draw: drawRepairEvidence,
  cues: [
    'repair-action',
    'repair-passes',
    'repair-cost-result',
    'repair-variants',
    'repair-overbudget-input',
    'repair-variants-result',
    'repair-nan',
    'repair-not-trial',
    'new-trials',
  ],
};
