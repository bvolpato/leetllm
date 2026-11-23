import { ease, gradientVector } from './arithmetic.mjs';
import { OWNER_IDS } from './fixtures.mjs';
import { sampleFunction } from 'vizmatic';
export function text(ctx, api, s, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, col, align);
}
export function equation(ctx, api, s, x, y, size = 40, col = api.C.ink) {
  return api.math(ctx, s, x, y, size, col, 'center');
}
export function line(ctx, api, x, y, xx, yy, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, xx, yy, col, w);
}
export function arrow(ctx, api, x, y, xx, yy, col = api.C.cyan, w = 3) {
  return api.arrow(ctx, x, y, xx, yy, col, w);
}
export function outline(ctx, api, x, y, w, h, col, width = 3) {
  return api.path(
    ctx,
    [
      {
        x,
        y,
      },
      {
        x: x + w,
        y,
      },
      {
        x: x + w,
        y: y + h,
      },
      {
        x,
        y: y + h,
      },
      {
        x,
        y,
      },
    ],
    {
      color: col,
      width,
    },
  );
}
export function dot(ctx, api, x, y, col = api.C.yellow, r = 11) {
  return api.circle(ctx, x, y, r, col);
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function formatNumber(ctx, api, n, d = 3) {
  return Number(n.toFixed(d)).toString();
}
export function head(ctx, api, s) {
  return text(ctx, api, s, 960, 260, 34, api.C.ink, 'center');
}
export function note(ctx, api, s) {
  return text(ctx, api, s, 960, 1030, 25, api.C.muted, 'center');
}
export function pill(ctx, api, s, x, y, w = 250, col = api.C.cyan, size = 30, h = 70) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, api.C.panel, col, 2);
  text(ctx, api, s, x, y + size * 0.34, size, col, 'center');
}
export function axes(ctx, api, opts) {
  return api.teaching.axes({
    fontSize: 25,
    ...opts,
  });
}
export function curve(ctx, api, plot, fn, lo, hi, col = api.C.yellow, progress = 1, width = 4) {
  return hi > lo
    ? api.teaching.curve({
        plot,
        points: sampleFunction(fn, lo, hi, 145),
        color: col,
        progress,
        width,
      })
    : undefined;
}
export function alpha(ctx, api, value, paint) {
  ctx.save();
  try {
    ctx.globalAlpha *= value;
    paint();
  } finally {
    ctx.restore();
  }
}
export function vector(ctx, api, v, x, y, cell = 130, col = api.C.cyan) {
  return v.forEach((n, i) =>
    pill(
      ctx,
      api,
      typeof n === 'number' ? formatNumber(ctx, api, n) : n,
      x + i * cell,
      y,
      cell - 10,
      col,
      29,
    ),
  );
}
export function block(ctx, api, values, x, y, cell = 100, col = api.C.cyan) {
  return values.forEach((row, i) =>
    row.forEach((v, j) =>
      pill(
        ctx,
        api,
        typeof v === 'number' ? formatNumber(ctx, api, v) : v,
        x + j * cell,
        y + i * 85,
        cell - 9,
        col,
        29,
      ),
    ),
  );
}
export function transfer(ctx, api, a, z, p, label, col = api.C.cyan) {
  arrow(ctx, api, a.x, a.y, z.x, z.y, api.C.muted, 2);
  if (p > 0) {
    const q = ease(p);
    pill(ctx, api, label, a.x + (z.x - a.x) * q, a.y + (z.y - a.y) * q, 160, col, 28);
  }
}
export function network(ctx, api, sceneId, params, options = {}) {
  const nodes = [
      {
        x: 235,
        y: 460,
      },
      {
        x: 235,
        y: 780,
      },
      {
        x: 915,
        y: 430,
      },
      {
        x: 915,
        y: 790,
      },
      {
        x: 1625,
        y: 610,
      },
    ],
    edges = [
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 3],
      [2, 4],
      [3, 4],
    ],
    loc = [
      [480, 440],
      [690, 575],
      [480, 630],
      [690, 785],
      [1250, 470],
      [1250, 750],
    ],
    labels = ['w₁₁', 'w₁₂', 'w₂₁', 'w₂₂', 'v₁', 'v₂'],
    vals = [...params.w1.flat(), ...params.w2],
    g = options.gradient ? gradientVector(options.gradient) : null,
    gIdx = [0, 1, 2, 3, 6, 7],
    biases = [
      [915, 310, 'b₁', params.b1[0], 4],
      [915, 920, 'b₂', params.b1[1], 5],
      [1625, 390, 'c', params.b2, 8],
    ];
  const objects = [
    ...nodes.map((n, i) => ({
      id: 'node-' + i,
      bounds: {
        x: n.x - (i === 4 ? 64 : 52),
        y: n.y - (i === 4 ? 64 : 52),
        width: i === 4 ? 128 : 104,
        height: i === 4 ? 128 : 104,
      },
    })),
    ...loc.map(([x, y], i) => ({
      id: 'edge-' + i,
      bounds: {
        x: x - 94,
        y: y - 41,
        width: 188,
        height: 82,
      },
    })),
    ...biases.map(([x, y], i) => ({
      id: 'bias-' + i,
      bounds: {
        x: x - 88,
        y: y - 41,
        width: 176,
        height: 82,
      },
    })),
  ];
  const gradientLocations = loc.map(([x, y]) => [x, y + 67]);
  biases.forEach(([x, y], i) => gradientLocations.push(i < 2 ? [x + 270, y + 8] : [x, y + 67]));
  if (g)
    gradientLocations.forEach(([x, y], i) =>
      objects.push({
        id: 'gradient-' + i,
        bounds: {
          x: x - 104,
          y: y - 31,
          width: 208,
          height: 42,
        },
      }),
    );
  const wire = (a, z) => {
    const dx = z.x - a.x,
      dy = z.y - a.y;
    let spans = [[0, 1]];
    for (const { bounds: r } of objects) {
      let lo = 0,
        hi = 1;
      for (const [origin, d, min, max] of [
        [a.x, dx, r.x, r.x + r.width],
        [a.y, dy, r.y, r.y + r.height],
      ]) {
        if (Math.abs(d) < 1e-9) {
          if (origin < min || origin > max) {
            lo = 1;
            hi = 0;
            break;
          }
        } else {
          const aa = (min - origin) / d,
            zz = (max - origin) / d;
          lo = Math.max(lo, Math.min(aa, zz));
          hi = Math.min(hi, Math.max(aa, zz));
        }
      }
      if (lo < hi)
        spans = spans.flatMap(([q, r]) =>
          hi <= q || lo >= r
            ? [[q, r]]
            : [
                [q, Math.max(q, lo)],
                [Math.min(r, hi), r],
              ].filter(([q, r]) => r - q > 0.001),
        );
    }
    for (const [q, r] of spans)
      line(ctx, api, a.x + dx * q, a.y + dy * q, a.x + dx * r, a.y + dy * r, api.C.muted, 2);
  };
  const signal = (from, to, progress, color = api.C.yellow) => {
    if (progress <= 0 || progress >= 1) return;
    const source = objects.find((o) => o.id === from),
      target = objects.find((o) => o.id === to);
    api.teaching.routedTransfer({
      id: 'signal-' + from + '-' + to,
      source: {
        id: from,
        shape: source.bounds,
        opacity: 1,
      },
      target: {
        id: to,
        shape: target.bounds,
        opacity: 1,
      },
      corridor: {
        x: 140,
        y: 270,
        width: 1660,
        height: 715,
      },
      obstacles: objects.filter((o) => o !== source && o !== target),
      progress,
      color,
      width: 2,
      margin: 2,
      marker: {
        radius: 7,
        fill: color,
      },
    });
  };
  focusTarget(ctx, api, 'first-layer-gradient', () =>
    focusTarget(
      ctx,
      api,
      sceneId === 'parameters'
        ? 'connection-weights'
        : sceneId === 'update'
          ? 'update-weights'
          : 'weight-rows',
      () =>
        edges.forEach(([i, j], k) => {
          wire(nodes[i], nodes[j]);
          if (options.connectionProgress !== undefined && k / 6 >= options.connectionProgress)
            return;
          focusTarget(ctx, api, 'owner-' + (k < 4 ? OWNER_IDS[k] : OWNER_IDS[k + 2]), () => {
            pill(
              ctx,
              api,
              labels[k] + ' ' + formatNumber(ctx, api, vals[k], 4),
              ...loc[k],
              176,
              k < 4 ? api.C.cyan : api.C.blue,
              28,
            );
            if (g && options.gradientVisible?.(gIdx[k]))
              text(
                ctx,
                api,
                '∇ ' + formatNumber(ctx, api, g[gIdx[k]], 4),
                ...gradientLocations[k],
                26,
                g[gIdx[k]] === 0 ? api.C.muted : api.C.yellow,
                'center',
              );
          });
        }),
    ),
  );
  focusTarget(
    ctx,
    api,
    sceneId === 'parameters'
      ? 'neuron-biases'
      : sceneId === 'update'
        ? 'update-biases'
        : 'network-biases',
    () =>
      biases.forEach(([x, y, label, value, index], i) => {
        wire(
          {
            x,
            y,
          },
          nodes[i + 2],
        );
        if (options.biasProgress !== undefined && i / 3 >= options.biasProgress) return;
        focusTarget(ctx, api, 'owner-' + OWNER_IDS[index], () => {
          pill(ctx, api, label + ' ' + formatNumber(ctx, api, value, 4), x, y, 164, api.C.pink, 28);
          if (g && options.gradientVisible?.(index))
            text(
              ctx,
              api,
              '∇ ' + formatNumber(ctx, api, g[index], 4),
              ...gradientLocations[i + 6],
              26,
              g[index] === 0 ? api.C.muted : api.C.yellow,
              'center',
            );
        });
      }),
  );
  focusTarget(ctx, api, 'request-vector', () =>
    nodes.forEach((n, i) => {
      api.circle(
        ctx,
        n.x,
        n.y,
        i === 4 ? 60 : 47,
        api.C.panel,
        i < 2 ? api.C.ink : i < 4 ? api.C.cyan : api.C.green,
        3,
      );
      let value = i < 2 ? options.x?.[i] : i < 4 ? options.hidden?.[i - 2] : options.output;
      text(
        ctx,
        api,
        value === undefined
          ? '?'
          : typeof value === 'number'
            ? formatNumber(ctx, api, value)
            : value,
        n.x,
        n.y + 10,
        i === 4 ? 29 : 31,
        i < 2 ? api.C.ink : i < 4 ? api.C.cyan : api.C.green,
        'center',
      );
    }),
  );
  text(ctx, api, 'prompt', 235, 365, 27, api.C.muted, 'center');
  text(ctx, api, 'queue', 235, 875, 27, api.C.muted, 'center');
  text(ctx, api, 'h₁ · ReLU', 1045, 405, 25, api.C.cyan);
  text(ctx, api, 'h₂ · ReLU', 1045, 840, 25, api.C.cyan);
  text(ctx, api, 'logit', 1760, 620, 27, api.C.green, 'center');
  return {
    nodes,
    loc,
    biases,
    signal,
  };
}
