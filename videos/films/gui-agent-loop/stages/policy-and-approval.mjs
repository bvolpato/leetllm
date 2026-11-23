import { cueProgress, readoutCell, retainedDrawCard, taskHeader, text } from '../defaults.mjs';
import { policyDecision } from '../model.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  {
    const actions = [
      ['Read failure', policyDecision('readRun'), themeColors.green],
      ['Save local note', policyDecision('saveDraft'), themeColors.cyan],
      ['Write incident', policyDecision('writeIncident'), themeColors.yellow],
      ['Rerun deploy', policyDecision('rerunDeploy'), themeColors.pink],
    ];
    actions.forEach(([label, decision, color], index) => {
      const y = 300 + index * 145;
      api.focus.target('requested-actions', () =>
        retainedDrawCard(ctx, api, label, 210, y, 600, color, 105, 29),
      );
      api.focus.target('policy-decisions', () =>
        retainedDrawCard(ctx, api, decision, 1010, y, 720, color, 105, 29),
      );
    });
  }
}
export function drawPolicyAndApproval(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat >= 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    taskHeader(ctx, api);
    if (currentBeat === 3) {
      text(
        ctx,
        api,
        'Separately authorized incident extension',
        960,
        365,
        37,
        themeColors.yellow,
        'center',
      );
      const fields = [
        'actor + session9 + incident7',
        'exact note digest + expected version3',
        'expiry + revocation + live permission',
      ];
      fields.forEach((v, i) =>
        readoutCell(ctx, api, v, 280, 450 + i * 145, 1360, themeColors.blue),
      );
      text(
        ctx,
        api,
        'Typing may autosave; classify actual effects from trusted target behavior',
        960,
        1030,
        31,
        themeColors.pink,
        'center',
      );
    } else {
      const mutated = cueProgress(ctx, api, 'collateral-mutation', q(4, 0.25, 0.45)) > 0;
      [
        ['incident7', 'intended note correct'],
        ['incident8', mutated ? 'unexpectedly CLOSED' : 'open / unchanged'],
      ].forEach(([id, status], i) => {
        readoutCell(
          ctx,
          api,
          id,
          180,
          430 + i * 240,
          450,
          i && mutated ? themeColors.pink : themeColors.blue,
        );
        readoutCell(
          ctx,
          api,
          status,
          900,
          430 + i * 240,
          840,
          i && mutated ? themeColors.pink : themeColors.green,
        );
      });
      text(
        ctx,
        api,
        mutated
          ? 'Verifier FAILS and STOPS; incident8 remains mutated'
          : 'Verifier checks the complete declared record scope',
        960,
        1000,
        35,
        mutated ? themeColors.pink : themeColors.yellow,
        'center',
      );
    }
  };
  api.focus.target('policy-and-approval-construction', body);
}
export default {
  id: 'policy-and-approval',
  draw: drawPolicyAndApproval,
  cues: [
    'policy-and-approval-b1-1',
    'policy-and-approval-b2-1',
    'policy-and-approval-b3-1',
    'policy-and-approval-construct-3',
    'policy-and-approval-construct-4',
    'collateral-mutation',
  ],
};
