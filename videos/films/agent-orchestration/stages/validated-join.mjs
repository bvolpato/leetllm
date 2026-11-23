import {
  cell,
  cueProgress,
  evidenceReceipt,
  focusTarget,
  graphText,
  receiptCard,
  requestIdentity,
  text,
} from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  {
    const bad = beat < 2,
      labels = ['Eval: tenant7', 'Health: ' + (bad ? 'tenant9' : 'tenant7'), 'Policy: tenant7'];
    const rows = labels.map((label, i) =>
      focusTarget(ctx, api, i === 1 ? 'health-receipt' : 'matching-receipts', () =>
        receiptCard(
          ctx,
          api,
          label,
          190,
          320 + i * 180,
          550,
          i === 1 && bad ? themeColors.pink : themeColors.green,
        ),
      ),
    );
    const target = focusTarget(ctx, api, 'join-decision', () =>
      receiptCard(
        ctx,
        api,
        beat === 0
          ? 'Decision pending'
          : bad
            ? api.focus.progress('reject-scope', q) > 0
              ? 'Reject mixed scope'
              : 'Inspect scope'
            : 'One proposal ready',
        1260,
        500,
        480,
        beat === 0 ? themeColors.yellow : bad ? themeColors.pink : themeColors.green,
        120,
      ),
    );
    rows.forEach((a, i) =>
      api.connect(ctx, a, target, {
        color: i === 1 && bad ? themeColors.pink : themeColors.green,
        gap: 38,
      }),
    );
    if (beat === 2)
      focusTarget(ctx, api, 'release-checks', () =>
        graphText(
          ctx,
          api,
          'Eval 2% ≤ 3% · errors 0.04% ≤ 0.1% · traffic 25% ≤ 25%',
          960,
          885,
          32,
          themeColors.green,
          'center',
        ),
      );
  }
}
export function drawValidatedJoin(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    requestIdentity(ctx, api);
    ['Eval', 'Health', 'Policy'].forEach((v, i) =>
      evidenceReceipt(ctx, api, v, 180 + i * 555, 390, 450),
    );
    const n =
      cueProgress(ctx, api, 'join-burn-rate', q(3, 0.6, 0.75)) >= 1
        ? 3
        : cueProgress(ctx, api, 'join-health-rate', q(3, 0.35, 0.5)) >= 1
          ? 2
          : cueProgress(ctx, api, 'join-eval-rate', q(3, 0.15, 0.25)) >= 1
            ? 1
            : 0;
    text(
      ctx,
      api,
      n >= 1 ? '2/100 =2% ≤3%' : 'Compute evaluation rate',
      420,
      690,
      36,
      n >= 1 ? themeColors.green : themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      n >= 2 ? '4/10,000 =0.04%' : 'Compute health rate',
      970,
      690,
      36,
      n >= 2 ? themeColors.green : themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      n >= 3 ? 'burn 0.04/0.1 =0.4×' : 'Compare with 0.1% allowance',
      1520,
      690,
      32,
      n >= 3 ? themeColors.green : themeColors.yellow,
      'center',
    );
    cell(ctx, api, 'traffic=-1: passes an upper-bound-only test', 250, 825, 1420, themeColors.pink);
    text(
      ctx,
      api,
      'Require in-range integer traffic before comparing with the 25% cap',
      960,
      1015,
      32,
      themeColors.yellow,
      'center',
    );
  };
  api.focus.target('validated-join-construction', body);
}
export default {
  id: 'validated-join',
  draw: drawValidatedJoin,
  cues: [
    'other-tenant',
    'predict-join',
    'reject-scope',
    'valid-identities',
    'reviewed-receipts',
    'numerical-rules',
    'validated-join-construct-3',
    'join-eval-rate',
    'join-health-rate',
    'join-burn-rate',
  ],
};
