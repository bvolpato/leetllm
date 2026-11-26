// Luminous cinema 2D vector-plane helper for Embedding Geometry scenes.
// Pure cinematic-kit module; all labels >= 26 px with guaranteed clearances.
import { arc, dot, dynamic, group, line } from 'vizmatic/stage';
import { COSMOS, aura, glowDot, markDecoration, txt } from '../cinematic-kit.mjs';
import { GUIDES, QUERY, ROLE, glowArc, glowVector } from './parts.mjs';

export { GUIDES as guides, QUERY };

/**
 * Full-bleed dark-cosmos 2D vector plane with dynamic zoom extent, glowing grid,
 * luminous vectors, perpendicular projection drops, angle wedges, L2 chords, and unit circle arc.
 */
export function cinemaVectorPlane({
  originX = -760,
  originY = 300,
  width = 920,
  height = 560,
  extent = () => 4.6,
  yPadTop = 40,
  maxYFixed = null,
} = {}) {
  const origin = [originX, originY];
  const scale = () => {
    const yBound = maxYFixed ?? Math.max(1.2, extent() * 0.56);
    return Math.min((width - 70) / extent(), (height - yPadTop) / yBound);
  };
  const p = ([x, y]) => [origin[0] + x * scale(), origin[1] - y * scale()];
  const span = (a, b, opts) => line(p(a), p(b), opts);

  const grid = dynamic(() => {
    const ext = extent();
    const sc = scale();
    const maxY = Math.max(1.15, (height - yPadTop) / sc);
    const step = ext <= 1.6 ? 0.5 : ext > 6 ? 2 : 1;
    const nodes = [
      markDecoration(
        aura(origin[0] + width * 0.45, origin[1] - height * 0.42, 420, '#1e356426', '#07091000'),
      ),
    ];

    for (let x = step; x <= ext + 1e-4; x += step) {
      const [sx, sy] = p([x, 0]);
      nodes.push(
        line([sx, sy], p([x, maxY]), { stroke: '#233152', width: 1.4 }).opacity(0.65),
        txt(Number.isInteger(x) ? String(x) : x.toFixed(1), sx, sy + 42, 26, COSMOS.dim, 'mono'),
      );
    }
    for (let y = step; y <= maxY + 1e-4; y += step) {
      const [sx, sy] = p([0, y]);
      nodes.push(
        line([sx, sy], p([ext, y]), { stroke: '#233152', width: 1.4 }).opacity(0.65),
        txt(
          Number.isInteger(y) ? String(y) : y.toFixed(1),
          sx - 32,
          sy,
          26,
          COSMOS.dim,
          'mono',
          'right',
        ),
      );
    }

    nodes.push(
      line(origin, p([ext + 0.12 * step, 0]), { stroke: '#556c9e', width: 2.8 }),
      line(origin, p([0, maxY + 0.08 * step]), { stroke: '#556c9e', width: 2.8 }),
      glowDot(origin[0], origin[1], { radius: 5, color: COSMOS.ink, glow: 6 }),
    );
    return group(...nodes);
  });

  const vector = (
    getVec,
    labelText,
    color,
    offset = [28, -26],
    { width: sw = 5.5, tip = 18 } = {},
  ) =>
    dynamic(() => {
      const v = getVec();
      const end = p(v);
      return group(
        glowVector(origin, end, { color, width: sw, tipSize: tip, glow: 9, dotRadius: 5 }),
        txt(labelText, end[0] + offset[0], end[1] + offset[1], 32, color, 'mono', 'left').glow(
          5,
          color,
        ),
      );
    });

  const angle = (getVec, radius, color, getQuery = () => QUERY, getSweep = () => 1) =>
    dynamic(() => {
      const [vx, vy] = getVec();
      const [qx, qy] = getQuery();
      const a0 = -Math.atan2(qy, qx);
      const a1 = -Math.atan2(vy, vx);
      const cur = a0 + (a1 - a0) * getSweep();
      return glowArc(origin[0], origin[1], radius, a0, cur, { color, width: 5, glow: 8 });
    });

  const gap = (getVec, getQuery = () => QUERY, color = ROLE.gold) =>
    dynamic(() => {
      const a = p(getQuery());
      const b = p(getVec());
      return group(
        line(a, b, { stroke: color, width: 4.5, dash: [10, 8] }).glow(7, color),
        dot(5, color).at(b[0], b[1]),
      );
    });

  const drop = (getVec, color) =>
    dynamic(() => {
      const [vx, vy] = getVec();
      const foot = p([vx, 0]);
      return group(
        span([vx, vy], [vx, 0], { stroke: color, width: 3.2, dash: [8, 7] }).glow(5, color),
        glowDot(foot[0], foot[1], { radius: 7, color, glow: 10 }),
      );
    });

  const unitArc = dynamic(() =>
    arc(scale(), -Math.PI / 2, 0, {
      stroke: ROLE.code,
      width: 3.2,
      dash: [8, 6],
    })
      .at(origin[0], origin[1])
      .glow(6, ROLE.code)
      .opacity(0.82),
  );

  return { origin, scale, p, span, grid, vector, angle, gap, drop, unitArc };
}

/** Standard query + Rotation (A) + Audit (B) arrow trio with safe non-colliding label offsets. */
export function guideVectors(
  plane,
  {
    query = () => QUERY,
    vectors = () => GUIDES.map((g) => g.vector),
    queryOffset = [22, 42],
    aOffset = [30, -34],
    bOffset = [30, -34],
  } = {},
) {
  return [
    plane.vector(query, 'q', ROLE.query, queryOffset, { width: 5.5, tip: 18 }),
    plane.vector(() => vectors()[0], 'A', ROLE.A, aOffset, { width: 5.8, tip: 18 }),
    plane.vector(() => vectors()[1], 'B', ROLE.B, bOffset, { width: 5.8, tip: 18 }),
  ];
}
