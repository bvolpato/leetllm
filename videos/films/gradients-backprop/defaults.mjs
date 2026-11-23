export function drawOriginalEquation(
  ctx,
  api,
  tex,
  x,
  y,
  size = 44,
  color = api.C.ink,
  align = 'left',
) {
  const { math } = api;
  const { ink } = api.C;
  return math(ctx, tex, x, y, size, color, align);
}
export function drawOriginalText(
  ctx,
  api,
  s,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  const { text } = api;
  const { ink } = api.C;
  return text(ctx, s, x, y, size, color, align, font);
}
export function drawShortArrow(ctx, api, canvas, x1, y1, x2, y2, color, width) {
  if (Math.hypot(x2 - x1, y2 - y1) > 8) api.arrow(canvas, x1, y1, x2, y2, color, width);
}
export function drawLabeledBox(ctx, api, x, y, w, h, title, value, accent = api.C.cyan) {
  const { ink, cyan, panel } = api.C;
  api.components.panel(
    {
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      fill: panel,
      stroke: accent,
      radius: 18,
      scope: 'label',
      padding: 12,
      id: title,
    },
    () => {
      drawOriginalEquation(ctx, api, title, x, y - 6, 32, accent, 'center');
      if (value) drawOriginalText(ctx, api, value, x, y + 34, 29, ink, 'center');
    },
  );
}
export function boundaryAnchor(ctx, api, node, toward) {
  const dx = toward.x - node.x,
    dy = toward.y - node.y;
  const scale = node.r
    ? node.r / Math.hypot(dx, dy)
    : Math.min(node.w / 2 / Math.abs(dx || 1e-9), node.h / 2 / Math.abs(dy || 1e-9));
  return {
    x: node.x + dx * scale,
    y: node.y + dy * scale,
  };
}
export function connectionEndpoints(ctx, api, from, to, color = api.C.muted) {
  const { muted } = api.C;
  const a = boundaryAnchor(ctx, api, from, to),
    b = boundaryAnchor(ctx, api, to, from);
  return [a.x, a.y, b.x, b.y, color];
}
export function drawGraphBox(ctx, api, node) {
  return drawLabeledBox(
    ctx,
    api,
    node.x,
    node.y,
    node.w,
    node.h,
    node.title,
    node.value,
    node.color,
  );
}
export function fadeConstruction(ctx, api, amount, draw) {
  return api.components.fade(api.clamp(amount), draw);
}
export function drawTransmission(ctx, api, edge, amount, reverse = false, override) {
  const [x1, y1, x2, y2, color] = edge;
  const from = reverse
    ? {
        x: x2,
        y: y2,
      }
    : {
        x: x1,
        y: y1,
      };
  const to = reverse
    ? {
        x: x1,
        y: y1,
      }
    : {
        x: x2,
        y: y2,
      };
  const q = api.clamp(amount);
  if (q > 0)
    drawShortArrow(
      ctx,
      api,
      ctx,
      from.x,
      from.y,
      api.lerp(from.x, to.x, q),
      api.lerp(from.y, to.y, q),
      override ?? color,
      4,
    );
}
export function drawAxes(ctx, api, b, xTex, yTex) {
  const { muted } = api.C;
  drawShortArrow(ctx, api, ctx, b.left, b.bottom, b.right, b.bottom, muted, 3);
  drawShortArrow(ctx, api, ctx, b.left, b.bottom, b.left, b.top, muted, 3);
  if (xTex) drawOriginalEquation(ctx, api, xTex, b.right - 6, b.bottom + 50, 32, muted, 'right');
  if (yTex) drawOriginalEquation(ctx, api, yTex, b.left - 22, b.top - 18, 32, muted, 'right');
}
export function drawCurve(
  ctx,
  api,
  b,
  xMin,
  xMax,
  yMin,
  yMax,
  fn,
  color = api.C.cyan,
  width = 5,
  reveal = 1,
) {
  const { cyan } = api.C;
  const X = (x) => b.left + ((x - xMin) / (xMax - xMin)) * (b.right - b.left);
  const Y = (y) => b.bottom - ((y - yMin) / (yMax - yMin)) * (b.bottom - b.top);
  const n = 140;
  const points = Array.from(
    {
      length: n + 1,
    },
    (_, i) => {
      const x = api.lerp(xMin, xMax, (i / n) * api.clamp(reveal));
      return {
        x: X(x),
        y: Y(fn(x)),
      };
    },
  );
  api.path(ctx, points, {
    color,
    width,
    clip: {
      x: b.left,
      y: b.top,
      width: b.right - b.left,
      height: b.bottom - b.top,
    },
  });
  return {
    X,
    Y,
  };
}
export function drawSegment(ctx, api, x1, y1, x2, y2, color, width = 4, progress = 1) {
  const { line } = api;
  const q = api.clamp(progress);
  line(ctx, x1, y1, api.lerp(x1, x2, q), api.lerp(y1, y2, q), color, width);
}
export function drawExtensionText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawExtensionEquation(ctx, api, s, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawExtensionLine(ctx, api, x, y, X, Y, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, X, Y, color, width);
}
export function drawExtensionDot(ctx, api, x, y, color = api.C.cyan, r = 10) {
  return api.circle(ctx, x, y, r, color);
}
export function drawExtensionArrow(ctx, api, x, y, X, Y, color = api.C.cyan, width = 4) {
  if (Math.hypot(X - x, Y - y) > 18) api.arrow(ctx, x, y, X, Y, color, width);
}
export function withTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawExtensionPanel(ctx, api, x, y, width, height, fn, color = api.C.border) {
  return api.components.panel(
    {
      x,
      y,
      width,
      height,
      stroke: color,
      fill: api.C.panel,
      padding: 12,
    },
    fn,
  );
}
export function drawExtensionCaption(ctx, api, s, color = api.C.muted) {
  return drawExtensionText(ctx, api, s, 960, 995, 28, color, 'center');
}
export function formatGradientValue(ctx, api, v, d = 4) {
  return Number(v.toFixed(d));
}
export function drawHiddenUnitGraph(
  ctx,
  api,
  s,
  {
    forward = true,
    reverse = false,
    gradientQuestion = false,
    result = false,
    weightTarget = 'hidden-weights',
    forwardTarget = 'hidden-values',
    gradientTarget = 'hidden-gradients',
  } = {},
) {
  withTarget(ctx, api, weightTarget, () => {
    ['w1', 'b1', 'w2', 'b2'].forEach((name, i) => {
      const x = 265 + i * 460;
      drawExtensionText(ctx, api, name, x, 310, 26, api.C.muted, 'center');
      drawExtensionText(
        ctx,
        api,
        formatGradientValue(ctx, api, s.weights[i]),
        x,
        370,
        40,
        api.C.yellow,
        'center',
      );
    });
  });
  const level = forward === true ? 3 : forward === false ? 0 : forward;
  const nodes = [
    {
      x: 200,
      label: 'input',
      value: s.input,
      color: api.C.blue,
    },
    {
      x: 580,
      label: 'h = w1·x + b1',
      value: level >= 1 ? s.h : '?',
      color: api.C.cyan,
    },
    {
      x: 960,
      label: 'z = ReLU(h)',
      value: level >= 2 ? s.z : '?',
      color: s.gate ? api.C.cyan : api.C.pink,
    },
    {
      x: 1360,
      label: 'prediction',
      value: level >= 3 ? s.prediction : '?',
      color: api.C.green,
    },
    {
      x: 1730,
      label: 'squared loss',
      value: result ? s.loss : '?',
      color: api.C.pink,
    },
  ];
  nodes.slice(1).forEach((n, i) => {
    drawExtensionLine(ctx, api, nodes[i].x + 70, 555, n.x - 70, 555, api.C.border, 3);
    if (level >= i + 1 || (i === 3 && result))
      drawExtensionArrow(
        ctx,
        api,
        nodes[i].x + 74,
        555,
        n.x - 74,
        555,
        i === 3 ? api.C.pink : api.C.cyan,
        4,
      );
  });
  withTarget(ctx, api, forwardTarget, () => {
    for (const n of nodes) {
      api.circle(ctx, n.x, 555, 67, api.C.panel, n.color, 3);
      drawExtensionText(
        ctx,
        api,
        n.value === '?'
          ? '?'
          : formatGradientValue(ctx, api, n.value, n.label === 'squared loss' ? 4 : 7),
        n.x,
        570,
        31,
        n.color,
        'center',
      );
      drawExtensionText(
        ctx,
        api,
        n.label === 'squared loss' &&
          n.value !== '?' &&
          Math.abs(n.value - formatGradientValue(ctx, api, n.value, 4)) > 1e-10
          ? 'squared loss ≈'
          : n.label,
        n.x,
        465,
        27,
        n.color,
        'center',
      );
    }
    drawExtensionText(ctx, api, 'target ' + s.target, 1730, 690, 29, api.C.green, 'center');
  });
  const depth = reverse === true ? 4 : Number(reverse);
  if (depth > 0)
    withTarget(ctx, api, gradientTarget, () => {
      const paths = [
        [1730, 1360, s.signal],
        [1360, 960, s.signal * s.weights[2]],
        [960, 580, s.signal * s.weights[2] * s.gate],
        [580, 200, s.inputGradient],
      ];
      for (const [x, X, value] of paths.slice(0, depth)) {
        drawExtensionArrow(
          ctx,
          api,
          x - 72,
          760,
          X + 72,
          760,
          s.gate || x > 960 ? api.C.pink : api.C.muted,
          4,
        );
        drawExtensionText(
          ctx,
          api,
          x === 580
            ? 'input ' + String(formatGradientValue(ctx, api, value)).replace('-', '−')
            : formatGradientValue(ctx, api, value),
          0.5 * (x + X),
          725,
          28,
          s.gate || x > 960 ? api.C.pink : api.C.muted,
          'center',
        );
      }
      if (depth >= 3) drawExtensionText(
        ctx,
        api,
        'local gate ' + s.gate,
        960,
        835,
        27,
        s.gate ? api.C.cyan : api.C.pink,
        'center',
      );
      if (depth >= 4) drawExtensionEquation(
        ctx,
        api,
        String.raw`\partial_{w_1}L=${formatGradientValue(ctx, api, s.signal * s.weights[2] * s.gate)}\times${s.input}=${formatGradientValue(ctx, api, s.gradient[0])}`,
        430,
        845,
        29,
        api.C.pink,
      );
      if (depth >= 2) drawExtensionEquation(
        ctx,
        api,
        String.raw`\partial_{w_2}L=${formatGradientValue(ctx, api, s.signal)}\times${formatGradientValue(ctx, api, s.z)}=${formatGradientValue(ctx, api, s.gradient[2])}`,
        1410,
        845,
        29,
        api.C.pink,
      );
      if (depth >= 4) drawExtensionEquation(
        ctx,
        api,
        String.raw`\nabla L=(${s.gradient.map((x) => formatGradientValue(ctx, api, x)).join(String.raw`,\,`)})`,
        960,
        915,
        43,
        api.C.pink,
      );
    });
  else if (gradientQuestion)
    withTarget(ctx, api, gradientTarget, () =>
      drawExtensionEquation(
        ctx,
        api,
        String.raw`\nabla L=(?,\;?,\;?,\;?)`,
        960,
        915,
        43,
        api.C.muted,
      ),
    );
}
