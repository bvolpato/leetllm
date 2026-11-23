import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismRect,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintRetrievalProof(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  const routeProgress = cueProgress('retrieval-proof-retrieve', 0),
    compare = cueProgress('retrieval-proof-compare', 0),
    missing = cueProgress('retrieval-proof-missing', 1);
  withGuardMechanismFocus(ctx, api, 'retrieval-access', () => {
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      'Caller-admitted sources',
      170,
      300,
      34,
      themeColors.blue,
    );
    ['current runbook · allowed', 'older conflicting version', 'private source · denied'].forEach(
      (s, i) => {
        drawGuardMechanismRect(
          ctx,
          api,
          themeColors,
          170,
          350 + i * 115,
          720,
          90,
          i === 0 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.pink,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          s,
          200,
          407 + i * 115,
          30,
          i === 0 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.pink,
        );
      },
    );
    if (routeProgress > 0)
      drawGuardMechanismArrow(ctx, api, themeColors, 920, 395, 1050, 395, themeColors.green);
  });
  drawGuardMechanismBlock(
    ctx,
    api,
    themeColors,
    'retrieval-pair',
    'Claim → returned passage',
    [
      '“Approval alone permits deployment”',
      'Source: “rollback requires manager approval”',
      compare === 1 ? 'Support: NOT ESTABLISHED' : 'Comparison pending',
    ],
    1100,
    350,
    670,
    355,
    themeColors.yellow,
    27,
  );
  drawGuardMechanismLabel(
    ctx,
    api,
    themeColors,
    'retrieval-missing',
    currentBeat === 1
      ? 'Sample agreement cannot populate a missing source slot'
      : 'A citation string is an address, not evidence of entailment',
    960,
    810,
    32,
    themeColors.yellow,
    'center',
  );
  withGuardMechanismFocus(ctx, api, 'retrieval-outcome', () => {
    if (currentBeat === 1) {
      if (cueDone('retrieval-proof-outcome', 1))
        ['remove', 'revise', 'abstain', 'escalate'].forEach((s, i) =>
          drawGuardMechanismText(
            ctx,
            api,
            themeColors,
            s,
            320 + i * 420,
            925,
            34,
            themeColors.pink,
            'center',
          ),
        );
      else
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Required support absent → outcome pending',
          960,
          925,
          34,
          themeColors.yellow,
          'center',
        );
    }
  });
}
export function drawRetrievalProof(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintRetrievalProof(
    ctx,
    scene,
    state,
    api,
    themeColors,
    currentBeat,
    cueProgress,
    cueDone,
  );
}
export default {
  id: 'retrieval-proof',
  draw: drawRetrievalProof,
  cues: [
    'retrieval-proof-retrieve',
    'retrieval-proof-compare',
    'retrieval-proof-missing',
    'retrieval-proof-outcome',
  ],
};
