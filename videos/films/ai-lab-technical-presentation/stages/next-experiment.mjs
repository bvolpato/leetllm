import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawNextExperiment(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('next-experiment', state);
  {
    const nodes = [
      {
        id: 'fixture',
        label: 'fixed query IDs + labels',
        x: 125,
        y: 350,
        width: 390,
        height: 105,
        color: themeColors.blue,
      },
      {
        id: 'corpus',
        label: 'fixed corpus + tenant',
        x: 575,
        y: 350,
        width: 390,
        height: 105,
        color: themeColors.green,
      },
      {
        id: 'change',
        label: 'vary connector path',
        x: 1025,
        y: 350,
        width: 390,
        height: 105,
        color: themeColors.yellow,
        focusTarget: 'next-experiment-node-change',
      },
      {
        id: 'pairs',
        label: 'paired results',
        x: 765,
        y: 650,
        width: 390,
        height: 105,
        color: themeColors.cyan,
        focusTarget: 'next-experiment-node-pairs',
      },
    ];
    teaching.flowGraph({
      nodes,
      edges: [
        {
          from: 'fixture',
          to: 'corpus',
          progress: modelState.queryHold,
          color: themeColors.blue,
        },
        {
          from: 'corpus',
          to: 'change',
          progress: modelState.queryHold,
          color: themeColors.green,
        },
        {
          from: 'change',
          to: 'pairs',
          progress: modelState.routeProgress,
          color: themeColors.cyan,
        },
      ],
    });
    api.focus.target('next-experiment-s-ablation-result', () =>
      card(ctx, api, modelState.ablation.result, 625, 810, 680, themeColors.pink, 84, 31),
    );
    text(
      ctx,
      api,
      'observed trace  ·  hypothesis  ·  next experiment',
      960,
      945,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'next-experiment',
  draw: drawNextExperiment,
  cues: [
    'next-experiment-beat-1-focus-1',
    'next-experiment-beat-1-focus-2',
    'next-experiment-beat-2-focus-1',
    'next-experiment-beat-2-focus-2',
  ],
};
