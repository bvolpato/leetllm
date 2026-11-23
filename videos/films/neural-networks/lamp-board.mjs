import { forward } from './arithmetic.mjs';
import { CASES } from './fixtures.mjs';
import { line, text } from './defaults.mjs';

export const boardPoint = ([a, b]) => ({ x: 360 + 535 * a, y: 855 - 535 * b });

export function lampBoard(ctx, api, recorded, drawInside, control = 'Switch') {
  const { C } = api;
  const { x: left, y: bottom } = boardPoint([0, 0]);
  const { x: right, y: top } = boardPoint([1, 1]);
  api.rect(ctx, left, top, right - left, bottom - top, C.panel, C.muted, 0);
  drawInside?.();
  for (const pair of CASES) {
    const { x, y } = boardPoint(pair);
    const known = recorded.some(([a, b]) => a === pair[0] && b === pair[1]);
    const lit = known && forward(pair).y === 1;
    api.circle(ctx, x, y, known ? 31 : 10, lit ? C.yellow : C.bg, lit ? C.yellow : C.muted, 4);
    text(ctx, api, '(' + pair.join(', ') + ')', x, y + (pair[1] ? -64 : 91), 34, C.ink, 'center');
  }
  text(ctx, api, control + ' A  →', (left + right) / 2, bottom + 107, 32, C.muted, 'center');
  text(ctx, api, 'B  ↑', left - 85, (bottom + top) / 2, 32, C.muted, 'center');
}

export function slideSwitch(ctx, api, name, value, position, x, y) {
  const { C } = api;
  line(ctx, api, x - 62, y, x + 62, y, C.muted, 58);
  line(ctx, api, x - 62, y, x + 62, y, C.panel, 50);
  api.circle(ctx, x - 62 + 124 * position, y, 29, value ? C.cyan : C.muted, C.ink, 3);
  text(ctx, api, name + (value ? ' on' : ' off'), x, y + 85, 38, C.ink, 'center');
}

export function bulb(ctx, api, x, y, lit) {
  const { C } = api;
  const radius = 130;
  const glass = Array.from({ length: 49 }, (_, i) => {
    const angle = ((145 + (250 * i) / 48) * Math.PI) / 180;
    return { x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) };
  });
  for (const [dx, dy] of [
    [68, 126],
    [56, 166],
    [-56, 166],
    [-68, 126],
  ])
    glass.push({ x: x + dx, y: y + dy });
  api.path(ctx, glass, {
    closed: true,
    fill: lit ? C.yellow : C.panel,
    color: lit ? C.yellow : C.muted,
    width: 6,
  });
  const filament = [
    [-30, 143],
    [-46, 7],
    [-24, 26],
    [0, 3],
    [24, 26],
    [46, 7],
    [30, 143],
  ];
  api.path(
    ctx,
    filament.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
    {
      color: lit ? C.bg : C.muted,
      width: 7,
    },
  );
  for (const [i, halfWidth] of [54, 51, 47, 22].entries())
    line(ctx, api, x - halfWidth, y + 179 + 13 * i, x + halfWidth, y + 179 + 13 * i, C.muted, 8);
  if (lit) {
    for (const degrees of [170, 210, 250, 290, 330, 10]) {
      const angle = (degrees * Math.PI) / 180;
      const dx = Math.cos(angle),
        dy = Math.sin(angle);
      line(ctx, api, x + 156 * dx, y + 156 * dy, x + 189 * dx, y + 189 * dy, C.yellow, 6);
    }
  }
}
