import { constructedFrame } from './construction.mjs';

const jars = [
  { name: 'A', x: 443, color: 'blue', striped: [true, false, true, true] },
  { name: 'B', x: 1477, color: 'pink', striped: [false, true, false, false] },
];
const matches = jars.map((jar) => jar.striped.filter(Boolean).length);
const matchCount = matches.reduce((sum, n) => sum + n, 0);

function marble(ctx, api, x, y, r, striped, angle = -0.52) {
  const { C } = api;
  api.circle(ctx, x, y, r, striped ? C.yellow : C.muted);
  if (striped) {
    // Chords rotate within the face of the rolling marble.
    for (const offset of [-0.38, 0, 0.38]) {
      const half = r * Math.sqrt(0.8 ** 2 - offset ** 2);
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const cx = x - dy * offset * r, cy = y + dx * offset * r;
      api.line(ctx, cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half,
        C.bg, r * 0.14);
    }
  }
  api.circle(ctx, x - r * 0.32, y - r * 0.48, r * 0.10, C.ink);
}

export function drawJars(ctx, state, api) {
  const { C } = api;
  const f = constructedFrame(state);
  const collect = f.progress('intro-matches', 1);
  const settled = f.completed('intro-shares', 1);
  const roll = api.clamp((state.t ?? 0) / 1.05);
  const markers = [];
  api.focus.target('jar-contents', () => {
    for (const jar of jars) {
      const x = jar.x, color = C[jar.color];
      const outline = [
        [-156, 342], [-156, 400], [-203, 448], [-203, 703], [-196, 732], [-171, 749],
        [171, 749], [196, 732], [203, 703], [203, 448], [156, 400], [156, 342],
      ].map(([dx, y]) => ({ x: x + dx, y }));
      api.path(ctx, outline, { closed: true, fill: C.panel, color, width: 6 });
      api.rect(ctx, x - 174, 320, 348, 34, C.panel, color, 9);
      api.text(ctx, 'Jar ' + jar.name, x, 287, 50, color, 'center');
      jar.striped.forEach((striped, i) => {
        const mx = x + (i % 2 ? 74 : -74);
        const my = 518 + Math.floor(i / 2) * 134;
        marble(ctx, api, mx, my, 56, striped);
        if (striped) markers.push({ x: mx, y: my, color });
      });
    }
    api.text(ctx, 'Before the draw, each jar was equally likely.', 960, 977, 32, C.muted, 'center');
  });
  api.focus.target('marble-draw', () => {
    const cy = 497 - 150 * (1 - roll) ** 2 - 20 * Math.sin(Math.PI * roll);
    const cx = 960 + 105 * (1 - roll) ** 2;
    marble(ctx, api, cx, cy, 94, true, -0.52 - 2.8 * (1 - roll) ** 2);
    api.text(ctx, 'Observed draw', 960, 662, 39, C.ink, 'center');
    if (collect <= 0) return;
    const gap = 92;
    markers.forEach((ball, i) => {
      const finishX = 960 + (i - (matchCount - 1) / 2) * gap;
      const x = api.lerp(ball.x, finishX, collect);
      const y = api.lerp(ball.y, 795, collect) - 68 * Math.sin(Math.PI * collect);
      api.circle(ctx, x, y, 33, ball.color);
      marble(ctx, api, x, y, 25, true);
    });
    if (settled) {
      const startX = 960 - matchCount * gap / 2;
      let left = startX;
      jars.forEach((jar, i) => {
        const width = matches[i] * gap;
        const color = C[jar.color];
        api.line(ctx, left + 4, 849, left + width - 4, 849, color, 6);
        api.text(ctx, jar.name + '  ' + matches[i] + '/' + matchCount,
          left + width / 2, 902, 35, color, 'center');
        left += width;
      });
    }
  });
}
