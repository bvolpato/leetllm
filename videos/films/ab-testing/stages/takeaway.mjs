import { drawFlow } from '../defaults.mjs';
export function drawTakeaway(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const stages = [
      ['lock the question', 110, themeColors.blue],
      ['assign by incident', 520, themeColors.cyan],
      ['measure the outcome', 950, themeColors.yellow],
      ['check every guardrail', 1380, themeColors.green],
    ];
    drawFlow(
      ctx,
      api,
      stages.map((v, i) => ({
        focusTarget: ['recap-question', 'recap-unit', 'recap-outcome', 'recap-guardrails'][i],
        id: `stage${i}`,
        label: v[0],
        x: v[1],
        y: 470,
        width: 365,
        height: 120,
        color: v[2],
      })),
      stages.slice(1).map((v, i) => ({
        from: `stage${i}`,
        to: `stage${i + 1}`,
        progress: phaseForBeat(i),
        color: v[2],
      })),
    );
  }
}
export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: [
    'takeaway-beat-1-focus-1',
    'takeaway-beat-1-focus-2',
    'takeaway-beat-2-focus-1',
    'takeaway-beat-3-focus-1',
  ],
};
