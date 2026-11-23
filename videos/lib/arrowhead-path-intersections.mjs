import { createCanvas } from '@napi-rs/canvas';

export const ARROWHEAD_PATH_RULE = Object.freeze({
  minimumArrowAlpha: 0.25,
  minimumStrokeAlpha: 0.25,
});
export const ARROWHEAD_PATH_SCOPE =
  'Positive-area geometric intersections between registered triangular heads and simple closed linear paths with visible round strokes, independent of paint order. Capture must begin on an unclipped context before drawing. Native stroke capture supplies the actual affine transform and local width; each segment is a round capsule in that coordinate system. Coincident endpoints also close an otherwise open path. A clip is supported only when every captured clip is a convex linear polygon proven to contain the entire stroke. Unsupported or unmatched registered closed paths are reported separately. Open paths, self-intersecting or degenerate loops, tangent contact, below-threshold paint, later repainting, final compositing and encoded pixels are outside this diagnostic.';

const finitePoint = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const cross = (a, b) => a.x * b.y - a.y * b.x;
const dot = (a, b) => a.x * b.x + a.y * b.y;
const magnitude = (points) => Math.max(1, ...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]));
const epsilonFor = (points) => 64 * Number.EPSILON * magnitude(points);
const near = (a, b, epsilon) => Math.hypot(a.x - b.x, a.y - b.y) <= epsilon;

function worldMatrix(ctx) {
  const m = ctx.getTransform(),
    sx = 1920 / ctx.canvas.width,
    sy = 1080 / ctx.canvas.height;
  return { a: m.a * sx, b: m.b * sy, c: m.c * sx, d: m.d * sy, e: m.e * sx, f: m.f * sy };
}
const transform = (m, p) => ({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f });
const sameMatrix = (a, b) => ['a', 'b', 'c', 'd', 'e', 'f'].every((key) => a[key] === b[key]);

// The proxy delegates with the native receiver and never changes native methods or state.
export function createClosedPathCapture(context) {
  if (
    !context?.canvas ||
    typeof context.stroke !== 'function' ||
    typeof context.getTransform !== 'function'
  ) {
    throw new TypeError('Closed-path capture requires a native canvas 2d context');
  }
  const strokes = [],
    methods = new Map(),
    saved = [],
    colors = new Map();
  const colorContext = createCanvas(1, 1).getContext('2d');
  let clips = [],
    current = { points: [], closed: false, reasons: [] };
  const begin = () => {
    current = { points: [], closed: false, reasons: [] };
  };
  const point = (x, y) => {
    const matrix = worldMatrix(context),
      local = { x, y };
    if (!finitePoint(local)) current.reasons.push('nonfinite path command');
    if (current.matrix && !sameMatrix(current.matrix, matrix))
      current.reasons.push('transform changed while constructing the path');
    current.matrix ??= matrix;
    current.points.push({ local, world: transform(matrix, local) });
  };
  function alpha() {
    const style = context.strokeStyle;
    if (typeof style !== 'string') return null;
    if (!colors.has(style)) {
      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = style;
      colorContext.fillRect(0, 0, 1, 1);
      if (colors.size === 256) colors.delete(colors.keys().next().value);
      colors.set(style, colorContext.getImageData(0, 0, 1, 1).data[3] / 255);
    }
    return context.globalAlpha * colors.get(style);
  }
  function record(args) {
    const matrix = worldMatrix(context),
      reasons = [...current.reasons];
    if (args.length) reasons.push('Path2D stroke is not captured');
    if (current.matrix && !sameMatrix(current.matrix, matrix))
      reasons.push('stroke transform differs from path construction');
    if (context.lineCap !== 'round' || context.lineJoin !== 'round')
      reasons.push('stroke requires round caps and joins');
    if (context.getLineDash().length) reasons.push('dashed stroke is not supported');
    if (context.globalCompositeOperation !== 'source-over')
      reasons.push('stroke compositing is not supported');
    if (context.filter && context.filter !== 'none')
      reasons.push('filtered stroke is not supported');
    if (context.shadowBlur || context.shadowOffsetX || context.shadowOffsetY)
      reasons.push('stroke shadows are not supported');
    const strokeAlpha = alpha();
    if (strokeAlpha === null) reasons.push('gradient or pattern stroke is not supported');
    strokes.push({
      points: current.points.map((p) => ({ ...p.world })),
      localPoints: current.points.map((p) => ({ ...p.local })),
      matrix,
      closed: current.closed,
      strokeWidth: context.lineWidth,
      strokeAlpha,
      clips: clips.map((clip) => ({
        points: clip.points.map((p) => ({ ...p })),
        reasons: [...clip.reasons],
      })),
      reasons,
    });
  }
  const proxy = new Proxy(context, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key))
        methods.set(key, (...args) => {
          // Read paint-time state before delegation; a thrown native call creates no record.
          if (key === 'stroke') {
            const length = strokes.length;
            record(args);
            try {
              return value.apply(target, args);
            } catch (error) {
              strokes.length = length;
              throw error;
            }
          }
          const result = value.apply(target, args);
          if (key === 'beginPath') begin();
          else if (key === 'moveTo') {
            if (current.points.length) current.reasons.push('multiple subpaths are not supported');
            point(...args);
          } else if (key === 'lineTo') {
            if (current.closed) current.reasons.push('commands after closePath are not supported');
            point(...args);
          } else if (key === 'closePath') current.closed = true;
          else if (key === 'rect') {
            if (current.points.length) current.reasons.push('multiple subpaths are not supported');
            const [x, y, width, height] = args;
            for (const p of [
              [x, y],
              [x + width, y],
              [x + width, y + height],
              [x, y + height],
            ])
              point(...p);
            current.closed = true;
          } else if (
            ['arc', 'arcTo', 'ellipse', 'roundRect', 'bezierCurveTo', 'quadraticCurveTo'].includes(
              key,
            )
          ) {
            current.reasons.push(`curved ${key} command is not supported`);
          } else if (key === 'clip') {
            const reasons = [...current.reasons];
            if (args.some((arg) => typeof arg !== 'string'))
              reasons.push('Path2D clip is not captured');
            clips = [...clips, { points: current.points.map((p) => ({ ...p.world })), reasons }];
          } else if (key === 'save') saved.push(clips);
          else if (key === 'restore' && saved.length) clips = saved.pop();
          else if (key === 'reset') {
            begin();
            clips = [];
            saved.length = 0;
          }
          return result;
        });
      return methods.get(key);
    },
    set(target, key, value) {
      return Reflect.set(target, key, value, target);
    },
  });
  return {
    context: proxy,
    strokes,
    reset() {
      strokes.length = 0;
      begin();
    },
    dispose() {
      strokes.length = 0;
      methods.clear();
      colors.clear();
      saved.length = 0;
      clips = [];
      begin();
    },
  };
}

function pointSegmentSquared(p, a, b) {
  const d = sub(b, a),
    length = dot(d, d),
    t = length ? Math.max(0, Math.min(1, dot(sub(p, a), d) / length)) : 0;
  const delta = { x: p.x - a.x - t * d.x, y: p.y - a.y - t * d.y };
  return dot(delta, delta);
}
function segmentsMeet(a, b, c, d, epsilon) {
  const ab = sub(b, a),
    cd = sub(d, c),
    denominator = cross(ab, cd),
    delta = sub(c, a);
  if (
    Math.abs(denominator) >
    epsilon * Math.max(1, Math.hypot(ab.x, ab.y), Math.hypot(cd.x, cd.y))
  ) {
    const t = cross(delta, cd) / denominator,
      u = cross(delta, ab) / denominator;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }
  return (
    Math.min(
      pointSegmentSquared(a, c, d),
      pointSegmentSquared(b, c, d),
      pointSegmentSquared(c, a, b),
      pointSegmentSquared(d, a, b),
    ) <=
    epsilon * epsilon
  );
}
function cleanLoop(points, closed, epsilon) {
  const loop = [];
  for (const p of points) if (!loop.length || !near(p, loop.at(-1), epsilon)) loop.push(p);
  const coincident = loop.length > 1 && near(loop[0], loop.at(-1), epsilon);
  if (!closed && !coincident) return { excluded: 'open path' };
  if (coincident) loop.pop();
  if (loop.length < 3) return { excluded: 'degenerate loop' };
  const area = loop.reduce(
    (sum, p, i) => sum + cross(sub(p, loop[0]), sub(loop[(i + 1) % loop.length], loop[0])),
    0,
  );
  const span = Math.max(...loop.map((p) => Math.hypot(p.x - loop[0].x, p.y - loop[0].y)));
  if (Math.abs(area) <= epsilon * span) return { excluded: 'degenerate loop' };
  for (let i = 0; i < loop.length; i++)
    for (let j = i + 1; j < loop.length; j++) {
      if (j === i + 1 || (i === 0 && j === loop.length - 1)) continue;
      if (
        segmentsMeet(
          loop[i],
          loop[(i + 1) % loop.length],
          loop[j],
          loop[(j + 1) % loop.length],
          epsilon,
        )
      ) {
        return { excluded: 'self-intersecting loop' };
      }
    }
  return { loop };
}
function triangleSegmentSquared(head, a, b, epsilon) {
  const inside = (p) => {
    const signs = head.map((q, i) => cross(sub(head[(i + 1) % 3], q), sub(p, q)));
    return signs.every((v) => v >= 0) || signs.every((v) => v <= 0);
  };
  if (inside(a) || inside(b)) return 0;
  let minimum = Infinity;
  for (let i = 0; i < 3; i++) {
    const c = head[i],
      d = head[(i + 1) % 3];
    if (segmentsMeet(a, b, c, d, epsilon)) return 0;
    minimum = Math.min(
      minimum,
      pointSegmentSquared(c, a, b),
      pointSegmentSquared(d, a, b),
      pointSegmentSquared(a, c, d),
      pointSegmentSquared(b, c, d),
    );
  }
  return minimum;
}
function clipContainsStroke(clip, stroke, epsilon) {
  if (clip.reasons.length || clip.points.length < 3) return false;
  const result = cleanLoop(clip.points, true, epsilon);
  if (!result.loop) return false;
  const { loop } = result,
    turns = loop.map((p, i) =>
      cross(
        sub(loop[(i + 1) % loop.length], p),
        sub(loop[(i + 2) % loop.length], loop[(i + 1) % loop.length]),
      ),
    );
  if (!turns.every((t) => t > 0) && !turns.every((t) => t < 0)) return false;
  const sign = turns[0] > 0 ? 1 : -1,
    m = stroke.matrix,
    radius = stroke.strokeWidth / 2;
  return loop.every((p, i) => {
    const d = sub(loop[(i + 1) % loop.length], p),
      normal = { x: -d.y * sign, y: d.x * sign };
    const support =
      radius * Math.hypot(m.a * normal.x + m.b * normal.y, m.c * normal.x + m.d * normal.y);
    return stroke.points.every(
      (q) => dot(normal, sub(q, p)) - support >= -epsilon * Math.hypot(normal.x, normal.y),
    );
  });
}

export function auditArrowheadClosedPaths(audit, strokes, rule = ARROWHEAD_PATH_RULE) {
  if (
    !Array.isArray(audit?.connectors) ||
    !Array.isArray(audit?.paths) ||
    !Array.isArray(strokes)
  ) {
    throw new TypeError('Registered connectors, paths and captured native strokes are required');
  }
  for (const value of [rule.minimumArrowAlpha, rule.minimumStrokeAlpha]) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new RangeError('Paint alpha thresholds must be between zero and one');
  }
  const candidates = [],
    unsupported = [],
    used = new Set();
  const issue = (path, reason) =>
    unsupported.push({ type: 'closed-path-unsupported', pathId: path.id, reason });
  for (const path of audit.paths) {
    if (!Array.isArray(path.points) || !path.points.every(finitePoint))
      throw new Error('Registered paths require finite points');
    if (!Number.isFinite(path.strokeAlpha) || !Number.isFinite(path.order))
      throw new Error('Registered paths require effective stroke alpha and paint order');
    if (
      path.strokeAlpha <= 0 ||
      path.strokeAlpha < rule.minimumStrokeAlpha ||
      path.points.length < 3
    )
      continue;
    const worldEpsilon = epsilonFor(path.points),
      registered = cleanLoop(path.points, path.closed, worldEpsilon);
    if (!registered.loop) continue;
    const matches = strokes.flatMap((stroke, i) =>
      !used.has(i) &&
      stroke.points.length === path.points.length &&
      stroke.points.every((p, j) => near(p, path.points[j], worldEpsilon))
        ? [i]
        : [],
    );
    if (!matches.length) {
      issue(path, 'closed registered path has no matching native linear stroke');
      continue;
    }
    const index = matches[0];
    if (matches.some((i) => JSON.stringify(strokes[i]) !== JSON.stringify(strokes[index]))) {
      issue(path, 'matching native centerlines have ambiguous stroke geometry');
      continue;
    }
    used.add(index);
    const stroke = strokes[index];
    if (stroke.reasons.length) {
      issue(path, [...new Set(stroke.reasons)].join('; '));
      continue;
    }
    if (
      !Number.isFinite(stroke.strokeAlpha) ||
      Math.abs(stroke.strokeAlpha - path.strokeAlpha) > 1 / 255
    ) {
      issue(path, 'captured effective stroke alpha does not match the registered path');
      continue;
    }
    if (!(stroke.strokeWidth > 0) || !Number.isFinite(stroke.strokeWidth)) {
      issue(path, 'native stroke width must be finite and positive');
      continue;
    }
    const m = stroke.matrix,
      determinant = m.a * m.d - m.b * m.c,
      scale = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
    if (
      !Object.values(m).every(Number.isFinite) ||
      !(scale > 0) ||
      Math.abs(determinant / scale / scale) <= 64 * Number.EPSILON
    ) {
      issue(path, 'native stroke transform is singular or ill-conditioned');
      continue;
    }
    if (!stroke.clips.every((clip) => clipContainsStroke(clip, stroke, worldEpsilon))) {
      issue(
        path,
        'active clip is curved, nonconvex, unknown or does not contain the entire stroke',
      );
      continue;
    }
    const inverse = (p) => ({
      x: (m.d * (p.x - m.e) - m.c * (p.y - m.f)) / determinant,
      y: (-m.b * (p.x - m.e) + m.a * (p.y - m.f)) / determinant,
    });
    const local = cleanLoop(stroke.localPoints, stroke.closed, epsilonFor(stroke.localPoints));
    if (!local.loop) {
      issue(path, 'captured native path closure differs from the registered loop');
      continue;
    }
    for (const arrow of audit.connectors) {
      if (arrow.kind !== 'arrow' && arrow.kind !== 'connect') continue;
      if (!Number.isFinite(arrow.alpha) || !Number.isFinite(arrow.order))
        throw new Error('Registered arrows require effective alpha and paint order');
      if (arrow.alpha <= 0 || arrow.alpha < rule.minimumArrowAlpha) continue;
      if (!Array.isArray(arrow.head) || arrow.head.length !== 3 || !arrow.head.every(finitePoint))
        throw new Error('Registered arrows require a finite triangular head');
      const head = arrow.head.map(inverse),
        inverseNorm =
          Math.max(Math.abs(m.a) + Math.abs(m.b), Math.abs(m.c) + Math.abs(m.d)) /
          Math.abs(determinant);
      const epsilon =
        64 *
        Number.EPSILON *
        Math.max(
          magnitude([...head, ...local.loop]),
          magnitude([...arrow.head, ...stroke.points]) * inverseNorm,
        );
      const halfWidth = stroke.strokeWidth / 2;
      if (!head.every(finitePoint) || !Number.isFinite(epsilon) || epsilon >= halfWidth * 1e-4) {
        issue(path, 'native coordinates cannot resolve stroke contact reliably');
        break;
      }
      const area = Math.abs(cross(sub(head[1], head[0]), sub(head[2], head[0])));
      if (
        area <=
        epsilon * Math.max(...head.map((p) => Math.hypot(p.x - head[0].x, p.y - head[0].y)))
      )
        continue;
      let distance = Infinity,
        segment = -1;
      for (let i = 0; i < local.loop.length; i++) {
        const d = Math.sqrt(
          triangleSegmentSquared(
            head,
            local.loop[i],
            local.loop[(i + 1) % local.loop.length],
            epsilon,
          ),
        );
        if (d < distance) {
          distance = d;
          segment = i;
        }
      }
      if (halfWidth - distance > epsilon)
        candidates.push({
          type: 'arrowhead-intersects-closed-path-stroke',
          arrowId: arrow.id,
          pathId: path.id,
          arrowOrder: arrow.order,
          pathOrder: path.order,
          arrowAlpha: arrow.alpha,
          strokeAlpha: stroke.strokeAlpha,
          head: arrow.head.map((p) => ({ ...p })),
          overlap: {
            nativeDistance: distance,
            nativeHalfWidth: halfWidth,
            nativeContactEpsilon: epsilon,
            segment,
          },
          clipping: stroke.clips.length ? 'entire-stroke-contained' : 'unclipped',
        });
    }
  }
  return { candidates, unsupported };
}
