import { fleetReady } from '../arithmetic.mjs';
import { phraseEnded, phraseProgress } from '../construction.mjs';
import { drawDispatch, drawFleet } from '../sampler.mjs';

export function drawReplicas(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const versions = [
    end('replicas-first', 0, 0.4) ? 12 : 11,
    end('replicas-second', 0, 0.55) ? 12 : 11,
    end('replicas-third', 2, 0.25) ? 12 : 11,
  ];
  const finished = end('replicas-finished-result', 2, 0.45);
  const probes = versions.map((_, i) =>
    i < 2 ? end('replicas-two-probes', 2, 0.65) : end('replicas-probe-result', 2, 0.8),
  );
  const ready = fleetReady(versions, 12, finished, probes);
  api.focus.target('replicas-evidence', () => {
    drawFleet(ctx, api, { x: 225, y: 305, width: 1470, versions, target: 12, finished, probes });
  });
  api.focus.target('replicas-route', () => {
    const held = end('replicas-hold', 1, 0.35);
    const status = ready
      ? 'Send the repair to its session replica'
      : held
        ? versions[2] !== 12
          ? 'Hold the repair    /    replica 2 still serves v11'
          : !finished
            ? 'Hold the repair    /    finish-update pending'
            : 'Hold the repair    /    waiting for probes'
        : 'Release the repair?';
    drawDispatch(ctx, api, {
      label: 'query-42_0   /   turn 2',
      ready,
      status,
      progress: phraseProgress(state, api, 'replicas-send', 2, 0.83, 0.97),
    });
  });
  api.text(ctx, 'First turn already sampled under v11', 225, 215, 31, C.blue);
}
export default {
  id: 'replicas',
  draw: drawReplicas,
  cues: [
    'replicas-first',
    'replicas-second',
    'replicas-hold',
    'replicas-third',
    'replicas-finished-result',
    'replicas-two-probes',
    'replicas-probe-result',
    'replicas-send',
  ],
};
