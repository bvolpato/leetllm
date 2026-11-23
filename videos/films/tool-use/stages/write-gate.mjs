import { cueProgress } from '../arithmetic.mjs';
import { writeGateSnapshot } from '../construction.mjs';
import { card, foot, text, visualFocus } from '../defaults.mjs';
export function drawWriteGate(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const current = writeGateSnapshot(beat, progress2, state.cues),
      granted = current.allowed,
      { rechecked, verified } = current;
    const graph = teaching.flowGraph({
      nodes: [
        {
          focusTarget: 'write-gate-node-request',
          id: 'request',
          label: `Place hold: book ${current.book}`,
          x: 170,
          y: 450,
          width: 450,
          height: 110,
          color: themeColors.blue,
        },
        {
          focusTarget: 'write-gate-node-policy',
          id: 'policy',
          label:
            beat === 2
              ? rechecked
                ? 'Current grant valid'
                : 'Recheck live policy'
              : granted
                ? 'Exact grant valid'
                : current.book !== 'B7'
                  ? 'Target outside grant'
                  : 'Grant missing',
          x: 820,
          y: 450,
          width: 360,
          height: 110,
          color: granted ? themeColors.green : themeColors.pink,
        },
        {
          focusTarget: 'write-gate-node-effect',
          id: 'effect',
          label: current.effects
            ? 'Hold recorded'
            : granted
              ? 'Execution waiting'
              : 'Effect blocked',
          x: 1390,
          y: 450,
          width: 360,
          height: 110,
          color: granted ? themeColors.green : themeColors.muted,
        },
      ],
      edges: [
        {
          from: 'request',
          to: 'policy',
          progress: 1,
        },
        {
          from: 'policy',
          to: 'effect',
          progress: current.effects ? 1 : undefined,
          color: current.effects ? themeColors.green : themeColors.muted,
        },
      ],
    });
    if (beat === 2) {
      const read = visualFocus(ctx, api, 'write-verified-result', () =>
        card(
          ctx,
          api,
          verified ? 'Verified: one hold on B7' : 'Read resulting hold state',
          1100,
          730,
          650,
          verified ? themeColors.green : themeColors.yellow,
          100,
        ),
      );
      if (rechecked) {
        const r = api.connect(ctx, graph.nodes.effect, read, {
          color: themeColors.green,
          gap: 25,
        });
        components.particle({
          points: [r.from, r.to],
          progress: verified
            ? 1
            : cueProgress(state.cues, 'write-gate-beat-3-focus-2', phase(progress2, 0.36, 0.75)),
          fill: themeColors.green,
          radius: 8,
        });
      }
    }
    text(
      ctx,
      api,
      'Supplied exact scope: Lena · book B7 · hold',
      960,
      330,
      37,
      themeColors.yellow,
      'center',
    );
    if (beat === 1)
      text(
        ctx,
        api,
        `Independent policy case · target ${current.book} · grant ${current.session.holdGrant ? 'present' : 'absent'} · effects ${current.effects}`,
        960,
        745,
        30,
        granted ? themeColors.green : themeColors.pink,
        'center',
      );
    foot(
      ctx,
      api,
      'Recheck mutable conditions at execution and verify the resulting service state',
    );
  }
}
export default {
  id: 'write-gate',
  draw: drawWriteGate,
  cues: [
    'write-gate-beat-1-focus-1',
    'write-gate-beat-1-focus-2',
    'write-gate-beat-2-focus-1',
    'write-change-target',
    'write-remove-grant',
    'write-gate-beat-2-focus-2',
    'write-gate-beat-3-focus-1',
    'write-gate-beat-3-focus-2',
    'write-verify-result',
  ],
};
