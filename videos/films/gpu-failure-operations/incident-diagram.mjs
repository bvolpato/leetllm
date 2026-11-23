import { mix } from './arithmetic.mjs';

export function diagram(ctx, api) {
  const { C } = api;
  return {
    label(value, x, y, size = 34, color = C.ink, align = 'left') {
      return api.text(ctx, String(value), x, y, size, color, align);
    },
    line(x, y, xx, yy, color = C.muted, width = 3) {
      return api.line(ctx, x, y, xx, yy, color, width);
    },
    block(x, y, w, h, fill, stroke) {
      return api.rect(ctx, x, y, w, h, fill, stroke, 0);
    },
    dot(x, y, radius, color) {
      return api.circle(ctx, x, y, radius, color);
    },
  };
}

// Both visits use the same junction. The gate belongs only to the upper worker.
export function drawAdmissionRoute(ctx, api, { gate, worker, peer, path, progress, gateLabel, token, priorPeerArrival }) {
  const { C } = api;
  const { label, line, block, dot } = diagram(ctx, api);
  const start = [225, 710], fork = [580, 710];
  const upper = [835, 600], lower = [835, 820];
  const active = path === 'worker' ? upper : lower;
  for (const [branch, color] of [[upper, C.blue], [lower, C.cyan]]) {
    line(...fork, ...branch, color, 5);
    line(...branch, 1410, branch[1], color, 5);
  }
  line(...start, ...fork, C.ink, 5);
  dot(...fork, 8, C.ink);
  block(1410, 551, 370, 98, C.panel, C.blue);
  block(1410, 771, 370, 98, C.panel, C.cyan);
  label(worker, 1595, 612, 32, C.ink, 'center');
  label(peer, 1595, 832, 32, C.ink, 'center');
  if (priorPeerArrival) {
    dot(1378, lower[1], 15, C.yellow);
    label(priorPeerArrival, 1365, lower[1] + 59, 29, C.yellow, 'right');
  }
  if (gate !== 'undecided') {
    const color = gate === 'closed' ? C.pink : C.green;
    const lift = gate === 'closed' ? 0 : 1;
    line(1060, 546, 1060 + 80 * lift, 635 - 90 * lift, color, 12);
    dot(1060, 546, 11, color);
    label(gateLabel, 1050, 500, 31, color, 'center');
  } else {
    label(gateLabel, 1050, 500, 31, C.yellow, 'center');
  }

  const waypoints = [start, fork, active, [1378, active[1]]];
  const step = Math.min(2, Math.floor(progress * 3));
  const t = progress * 3 - step;
  const a = waypoints[step], z = waypoints[step + 1];
  if (token) {
    const tokenX = mix(a[0], z[0], t);
    dot(tokenX, mix(a[1], z[1], t), 18, C.yellow);
    if (progress <= 1 / 3) label(token, tokenX, 655, 30, C.yellow, 'center');
    if (progress === 1) label(token, 1365, active[1] + 59, 29, C.yellow, 'right');
  }
}
