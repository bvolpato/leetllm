import { vvProgress } from '../construction.mjs';
import { arrow, chapterCard, chapterText } from '../defaults.mjs';

export function drawRouteSecurity(ctx, scene, state, api) {
  const { C } = api;
  const done = (id, beat) => vvProgress(state, 'vv-route-security-' + id, beat) === 1;
  api.focus.target('vllm-route-security-mechanism', () => {
    if (state.beat === 0) {
      chapterText(ctx, api, 'Registered routes for scoring', 290, 330, 40, C.ink);
      chapterCard(ctx, api, 'Primary name', 290, 411, 450, C.cyan);
      chapterCard(ctx, api, 'Registered alias', 290, 651, 450, C.cyan);
      if (done('aliases', 0)) {
        arrow(ctx, api, 763, 460, 1055, 560, C.green);
        arrow(ctx, api, 763, 700, 1055, 591, C.green);
        chapterCard(ctx, api, 'Authenticate + allow scoring', 1090, 514, 615, C.green, 125, 35);
      }
    } else if (state.beat === 1) {
      chapterText(ctx, api, 'A scoring request', 200, 360, 40, C.ink);
      chapterCard(ctx, api, 'Client', 199, 458, 295, C.blue);
      arrow(ctx, api, 519, 506, 633, 506, C.blue);
      chapterCard(ctx, api, 'Gateway checks caller + route', 661, 458, 610, C.yellow);
      if (done('gateway', 1)) {
        arrow(ctx, api, 1296, 506, 1408, 506, C.green);
        chapterCard(ctx, api, 'Scoring service', 1435, 458, 330, C.green);
      }
      chapterText(
        ctx,
        api,
        'Server ingress accepts only the gateway.',
        960,
        759,
        39,
        C.ink,
        'center',
      );
    } else {
      chapterText(
        ctx,
        api,
        'Worker traffic stays inside the serving cluster',
        960,
        345,
        42,
        C.ink,
        'center',
      );
      api.rect(ctx, 250, 450, 1420, 335, C.panel, C.green, 18);
      chapterCard(ctx, api, 'Worker A', 334, 550, 352, C.cyan);
      chapterCard(ctx, api, 'Worker B', 1225, 550, 352, C.cyan);
      if (done('internal', 2)) {
        arrow(ctx, api, 718, 596, 1192, 596, C.green);
        chapterText(ctx, api, 'KV transfer', 955, 554, 34, C.green, 'center');
      }
      chapterText(
        ctx,
        api,
        'Private network  ·  firewall admits cluster peers',
        960,
        890,
        37,
        C.green,
        'center',
      );
    }
  });
}

export default {
  id: 'route-security',
  draw: drawRouteSecurity,
  cues: ['vv-route-security-aliases', 'vv-route-security-gateway', 'vv-route-security-internal'],
};
