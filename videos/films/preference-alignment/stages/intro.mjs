import { ROUTE_FIXTURE } from '../fixtures.mjs';
import { progress, heard } from '../clock.mjs';

function station(ctx, api, x, y) {
  const { C } = api;
  for (const side of [-1, 1]) {
    api.line(ctx, x + side * 45, y - 55, x + side * 80, y - 14, C.muted, 9);
  }
  api.line(ctx, x - 65, y - 29, x + 65, y - 29, C.muted, 6);
  api.rect(ctx, x - 86, y - 197, 172, 146, C.ink, null, 27);
  api.rect(ctx, x - 61, y - 172, 122, 54, C.bg, null, 10);
  for (const side of [-1, 1]) api.circle(ctx, x + side * 48, y - 82, 12, C.bg);
}

function walk(ctx, api, points, amount, color) {
  if (amount <= 0) return;
  const path = api.tracePolyline(points, amount);
  const tip = path.at(-1);
  const from = path.at(-2);
  api.path(ctx, path, { color, width: 18 });
  if (!from) return;
  const length = Math.hypot(tip.x - from.x, tip.y - from.y);
  if (!length) return;
  const dx = (tip.x - from.x) / length;
  const dy = (tip.y - from.y) / length;
  const offset = (forward, side) => ({
    x: tip.x + dx * forward - dy * side,
    y: tip.y + dy * forward + dx * side,
  });
  api.path(ctx, [offset(23, 0), offset(-31, -27), offset(-17, 0), offset(-31, 27)], {
    closed: true,
    fill: color,
    color: api.C.bg,
    width: 4,
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const { clear, detour, chosen, rejected } = ROUTE_FIXTURE;
  const point = ([x, y]) => ({ x: 1460 + x * (x < 0 ? 251 : 106), y: 745 - y * 146 });
  const [routeA, routeB] = [clear.map(point), detour.map(point)];
  const [entrance, cafe, stop] = routeA;
  const [, park, river] = routeB;
  const vote = heard(state, 'route-vote', 2);
  const aColor = vote ? C.green : C.blue;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;

  // A is already leaving the entrance at the cut. It reaches each corner with the voice.
  const firstTurnEnd = state.cues?.['start-walk'].end ?? 2;
  const firstLeg = state.beat > 0 ? 1 : Math.min(1, time / firstTurnEnd);
  const corner = (entrance.x - cafe.x) / (entrance.x - cafe.x + (cafe.y - stop.y));
  const amountA = corner * (0.1 + 0.9 * firstLeg) + (1 - corner) * progress(state, 'route-a', 0);

  api.text(ctx, 'How do I reach\nthe station?', 120, 298, 68, C.ink);
  api.focus.target('route-map', () => {
    api.path(ctx, routeA, { color: C.muted, width: 14 });
    if (state.beat >= 1) {
      api.path(ctx, routeB, { color: C.muted, width: 12 });
      for (const p of [park, river]) api.circle(ctx, p.x, p.y, 14, C.bg, C.ink, 5);
      api.text(ctx, 'Park', park.x, park.y + 66, 39, C.ink, 'center');
      api.text(ctx, 'River', river.x, river.y - 38, 39, C.ink, 'center');
    }
    for (const p of [entrance, cafe, stop]) {
      api.circle(ctx, p.x, p.y, 14, C.bg, C.ink, 5);
    }
    station(ctx, api, stop.x, stop.y);
    api.text(ctx, 'Station', stop.x + 110, stop.y - 102, 43, C.ink);
    api.text(ctx, 'Café', cafe.x, cafe.y + 66, 39, C.ink, 'center');
    api.text(ctx, 'North entrance', entrance.x, entrance.y + 66, 39, C.ink, 'center');
    api.arrow(
      ctx,
      entrance.x - 130,
      entrance.y + 119,
      entrance.x - 130,
      entrance.y + 85,
      C.muted,
      5,
    );
    api.text(ctx, 'Start facing north', entrance.x - 105, entrance.y + 113, 30, C.muted);
  });

  function reply(label, lines, y, color) {
    api.text(ctx, label, 120, y, 41, color);
    lines.forEach((line, i) => api.text(ctx, line, 120, y + 64 + i * 53, 37, C.ink));
  }

  api.focus.target('walk-a', () => {
    reply('Reply A', chosen, 515, aColor);
    walk(ctx, api, routeA, amountA, aColor);
  });
  if (state.beat >= 1) {
    api.focus.target('walk-b', () => {
      reply('Reply B', rejected, 753, C.cyan);
      walk(ctx, api, routeB, progress(state, 'route-b', 1), C.cyan);
    });
  }
  if (vote) api.text(ctx, 'Recorded vote    A over B', 960, 982, 44, C.green, 'center');
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['start-walk', 'introduce-a', 'route-a', 'route-b', 'route-vote'],
};
