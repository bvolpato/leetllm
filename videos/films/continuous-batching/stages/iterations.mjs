import { drawEstablishedBatchingText } from '../defaults.mjs';
export function drawIterations(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {});
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  {
    api.focus.target('iterations-prompt-work-first-then-repeated-decode-opportunities', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        'Prompt work first; then repeated decode opportunities',
        960,
        285,
        38,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('prompt-input', () =>
      components.tokenRow({
        values: ['The', 'cat', 'sat', 'on', 'the', 'mat'],
        centerX: 960,
        y: 410,
        width: 185,
        gap: 25,
        height: 85,
        fontSize: 33,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.ink,
        reveal: phaseForBeat(0),
      }),
    );
    const nodes = [
      {
        id: 'prefill',
        focusTarget: 'prompt-prefill',
        label: 'Prompt prefill',
        x: 250,
        y: 675,
        width: 350,
        height: 110,
      },
      {
        id: 'state',
        focusTarget: 'resident-kv',
        label: 'Per-request KV state',
        x: 780,
        y: 675,
        width: 390,
        height: 110,
      },
      {
        id: 'decode',
        focusTarget: 'decode-step',
        label: 'Next-token decode',
        x: 1340,
        y: 675,
        width: 390,
        height: 110,
      },
    ];
    teaching.flowGraph({
      nodes,
      edges: [
        {
          from: 'prefill',
          to: 'state',
          gap: 16,
          progress: phaseForBeat(1),
        },
        {
          from: 'state',
          to: 'decode',
          gap: 16,
          progress: phaseForBeat(2),
        },
      ],
      textColor: themeColors.ink,
    });
    api.focus.target('iterations-our-first-schedule-starts-with-ready-decode-state', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        'Our first schedule starts with ready decode state',
        960,
        940,
        31,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'iterations',
  draw: drawIterations,
  cues: [
    'prompt-prefill',
    'retained-state',
    'decode-step',
    'request-history',
    'output-boundary',
    'ready-decode',
    'iteration-advance',
  ],
};
