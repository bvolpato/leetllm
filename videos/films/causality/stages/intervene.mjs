import { equation } from '../defaults.mjs';
export function drawIntervene(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const intervention = phaseForBeat(0),
      nodes = [
        {
          focusTarget: 'graph-node-risk',
          id: 'risk',
          label: 'pre-routing risk',
          x: 760,
          y: 280,
          width: 400,
          height: 100,
          color: themeColors.yellow,
        },
        {
          focusTarget: 'graph-node-action',
          id: 'action',
          label: 'workflow assignment',
          x: 220,
          y: 610,
          width: 440,
          height: 110,
          color: themeColors.cyan,
        },
        {
          id: 'outcome',
          label: 'resolved in 24 hours',
          x: 1260,
          y: 610,
          width: 440,
          height: 110,
          color: themeColors.pink,
        },
      ],
      edges = [
        {
          from: 'risk',
          to: 'outcome',
          progress: phaseForBeat(0),
          color: themeColors.yellow,
        },
        {
          from: 'action',
          to: 'outcome',
          progress: phaseForBeat(1),
          color: themeColors.cyan,
        },
      ];
    if (intervention < 0.5)
      edges.push({
        from: 'risk',
        to: 'action',
        progress: phaseForBeat(0),
        color: themeColors.yellow,
      });
    api.teaching.flowGraph({
      nodes,
      edges,
      fill: themeColors.panel,
      textColor: themeColors.ink,
    });
    {
      equation(ctx, api, '\\operatorname{do}(A=1)', 960, 950, 54, themeColors.cyan, 'center');
    }
  }
}
export default {
  id: 'intervene',
  draw: drawIntervene,
  cues: [
    'intervene-beat-1-focus-1',
    'intervene-beat-1-focus-2',
    'intervene-beat-2-focus-1',
    'intervene-beat-2-focus-2',
    'intervene-beat-3-focus-1',
    'intervene-beat-3-focus-2',
  ],
};
