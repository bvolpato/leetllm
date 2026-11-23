/* Retained stages evaluate the original rejected-upgrade API getters and clock before their established painter. These reads and calls are observable to instrumented consumers. */ export function preserveRejectedUpgradePrelude(
  state,
  api,
) {
  const { C: upgradeColors, components: upgradeComponents } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    easedProgress = api.phase(beatProgress, 0.06, 0.88);
}
export function drawUnknownHallucinationScene(ctx, scene, state, api) {
  preserveRejectedUpgradePrelude(state, api);
  const { C, components: c, teaching: t } = api,
    beat = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1);
  throw new Error('Unknown hallucination-evidence scene ' + scene.id);
}
