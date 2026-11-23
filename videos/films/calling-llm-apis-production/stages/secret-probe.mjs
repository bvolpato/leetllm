import { cueClock } from '../cued-trace.mjs';

export function drawSecretProbe(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  if (state.beat === 0) {
    api.text(ctx, 'Server startup  /  local placeholder', 165, 290, 43, C.ink);
    api.focus.target('startup-check', () => {
      api.text(ctx, 'Setting supplied', 165, 408, 33, C.muted);
      api.text(ctx, 'Observed result', 988, 408, 33, C.muted);
      api.line(ctx, 165, 446, 1720, 446, C.muted, 2);
      api.text(ctx, 'Missing or blank', 165, 568, 48, C.ink);
      if (clock.after('empty-setting')) api.text(ctx, 'Startup stops', 988, 568, 48, C.yellow);
      if (clock.started('present-setting')) {
        api.text(ctx, 'Placeholder present', 165, 726, 48, C.ink);
        if (clock.after('present-setting')) api.text(ctx, 'Loaded', 988, 726, 48, C.green);
      }
    });
    if (clock.after('present-setting'))
      api.text(ctx, 'Model permission still untested', 165, 951, 38, C.muted);
    return;
  }
  if (state.beat === 1) {
    api.text(ctx, 'Referenced public setting', 165, 323, 37, C.muted);
    api.text(ctx, 'NEXT_PUBLIC_…', 165, 409, 47, C.ink, 'left', 'mono');
    api.text(ctx, 'VITE_…', 165, 476, 47, C.ink, 'left', 'mono');
    api.focus.target('delivery-path', () => {
      api.text(ctx, 'Build output', 165, 624, 37, C.muted);
      api.text(ctx, 'Browser bundle', 1705, 624, 37, C.muted, 'right');
      api.line(ctx, 330, 724, 1500, 724, C.muted, 3);
      const x = 330 + 1170 * clock.p('bundle-delivery');
      api.rect(ctx, x - 151, 673, 302, 102, C.panel, C.yellow, 12);
      api.text(ctx, 'Placeholder', x, 739, 35, C.yellow, 'center');
      if (clock.after('client-can-read'))
        api.text(ctx, 'Client receives the bytes', 1705, 870, 38, C.yellow, 'right');
    });
    api.text(ctx, 'Framework and provider documentation  /  6 Nov 2026', 165, 997, 27, C.muted);
    return;
  }
  const repaired = clock.after('enforce-sign-in');
  const left = 350,
    gate = 850,
    service = 1450;
  api.text(ctx, 'Signed-out browser', left, 395, 40, C.ink, 'center');
  api.text(ctx, 'Application route', gate, 395, 40, C.ink, 'center');
  api.text(ctx, 'Provider', service, 395, 40, C.ink, 'center');
  api.focus.target('server-key', () => {
    api.text(ctx, 'Provider key stays on the server', gate, 284, 38, C.blue, 'center');
    if (clock.after('proxy-spend') && !repaired) {
      api.line(ctx, gate, 622, service, 622, C.yellow, 8);
      api.circle(ctx, service, 622, 13, C.yellow);
      api.text(ctx, 'Billable call', service, 720, 38, C.yellow, 'center');
    }
  });
  api.focus.target('caller-request', () => {
    api.line(ctx, left, 525, service, 525, C.muted, 2);
    const x = left + (gate - left) * clock.p('anonymous-request');
    api.line(ctx, left, 525, x, 525, C.cyan, 8);
    api.circle(ctx, x, 525, 12, C.cyan);
    api.text(
      ctx,
      repaired ? 'Sign-in required' : 'Forwards every request',
      gate,
      470,
      31,
      repaired ? C.green : C.yellow,
      'center',
    );
    if (repaired) {
      api.line(ctx, gate + 23, 502, gate + 23, 548, C.pink, 5);
      api.text(ctx, 'Rejected here', gate, 626, 38, C.pink, 'center');
      api.text(ctx, '0 provider calls', service, 626, 38, C.ink, 'center');
    }
  });
  if (repaired)
    api.text(
      ctx,
      'Signed-in path     Check tenant and account access     →     Enforce usage limit     →     Call provider',
      165,
      933,
      32,
      C.ink,
    );
  else if (clock.after('anonymous-request') && state.beat === 2)
    api.text(ctx, "Can this caller spend the organization's quota?", 165, 940, 44, C.ink);
}

export default {
  id: 'secret-probe',
  draw: drawSecretProbe,
  cues: [
    'empty-setting',
    'present-setting',
    'bundle-delivery',
    'client-can-read',
    'server-secret',
    'anonymous-request',
    'proxy-spend',
    'enforce-sign-in',
  ],
};
