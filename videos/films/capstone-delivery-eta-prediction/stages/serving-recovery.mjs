import { completed } from '../shipment.mjs';

export function drawServingRecovery(ctx, scene, state, api) {
  const { C } = api;
  const alias = completed(api, 'registry-change') ? 'v3' : 'v2';
  const candidate = completed(api, 'workers-loaded'),
    routed = completed(api, 'route-candidate'),
    verifiedCandidate = completed(api, 'verify-route');
  const restored = completed(api, 'restore-ready'),
    switched = completed(api, 'recovery-traffic'),
    verified = completed(api, 'verify-recovery');
  const live = switched ? 'v2' : routed ? 'v3' : 'v2';
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('serving-recovery-construction', () => {
    tx('Illustrative rollout    /    Registry alias  →  ' + alias, 150, 265, 37, C.yellow);
    const workers = [
      { v: 'v2', ready: !routed || restored },
      { v: 'v3', ready: candidate },
    ];
    tx('Request', 160, 620, 49);
    workers.forEach(({ v, ready }, i) => {
      const y = 460 + i * 285,
        active = live === v;
      const col = active ? C.cyan : C.muted;
      if (active) api.arrow(ctx, 410, 598, 775, y, col, 7);
      api.rect(ctx, 800, y - 78, 520, 150, C.panel, col, 10);
      tx('Worker  ' + v, 855, y + 13, 47, col);
      tx(ready ? 'Ready' : 'Unloaded', 1440, y + 10, 39, ready ? C.green : C.muted);
    });
    const awaitingProbe = switched ? !verified : routed && !verifiedCandidate;
    tx(
      awaitingProbe ? 'Probe the routed worker' : 'Probe response    /    ' + live + ' fingerprint',
      960,
      957,
      46,
      awaitingProbe ? C.yellow : C.ink,
      'center',
    );
  });
}
export default {
  id: 'serving-recovery',
  draw: drawServingRecovery,
  cues: [
    'registry-change',
    'route-candidate',
    'workers-loaded',
    'verify-route',
    'restore-ready',
    'recovery-traffic',
    'verify-recovery',
  ],
};
