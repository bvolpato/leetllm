export function optionalFocusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function retainedText(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function retainedEquation(ctx, api, v, x, y, size = 46, color = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function flow(ctx, api, nodes, edges) {
  return api.teaching.flowGraph({
    nodes,
    edges,
    fill: api.C.panel,
    textColor: api.C.ink,
    padding: 16,
  });
}
export function signedBars(
  ctx,
  api,
  {
    x,
    y,
    width,
    height,
    values,
    labels,
    colors,
    min = -140,
    max = 80,
    progress = 1,
    fontSize = 27,
    slots = values.length,
  },
) {
  const ticks = [-100, -50, 0, 50].filter((v) => v >= min && v <= max);
  const plot = api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: [0, slots + 1],
    yDomain: [min, max],
    xLabel: '',
    yLabel: 'discounted return',
    xTicks: [],
    yTicks: ticks,
    fontSize: 24,
  });
  const zero = plot.point(1, 0).y;
  api.line(ctx, plot.bounds.x, zero, plot.bounds.x + plot.bounds.width, zero, api.C.muted, 3);
  values.forEach((value, i) => {
    const start = plot.point(i + 1, 0);
    const end = plot.point(i + 1, api.lerp(0, value, progress));
    api.line(ctx, start.x, start.y, end.x, end.y, colors[i], 12);
    api.circle(ctx, end.x, end.y, 8, colors[i]);
    retainedText(ctx, api, labels[i], start.x, y + height + 36, fontSize, colors[i], 'center');
    if (progress >= 0.82)
      retainedText(
        ctx,
        api,
        `${value > 0 ? '+' : ''}${value.toFixed(0)}`,
        end.x,
        end.y + (value < 0 ? 29 : -18),
        25,
        colors[i],
        'center',
      );
  });
}
export function text(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function line(ctx, api, x, y, u, v, color = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, color, w);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 10);
}
export function episodeLink(ctx, api, y, color) {
  line(ctx, api, 698, y, 710, y, color, 3);
  line(ctx, api, 710, y, 710, y - 65, color, 3);
  line(ctx, api, 710, y - 65, 1170, y - 65, color, 3);
  line(ctx, api, 1170, y - 65, 1170, y, color, 3);
  line(ctx, api, 1170, y, 1182, y, color, 3);
}
export function ownedState(ctx, api, label, x, y, color = api.C.yellow, sub = '') {
  api.circle(ctx, x, y, 88, api.C.panel, color, 4);
  text(ctx, api, label, x, y + 11, 29, color, 'center');
  if (sub) text(ctx, api, sub, x, y + 125, 28, api.C.muted, 'center');
}
export function moveValue(ctx, api, value, a, z, t, color, size = 34) {
  const x = a[0] + (z[0] - a[0]) * t,
    y = a[1] + (z[1] - a[1]) * t;
  rectangle(ctx, api, x - 67, y - 33, 134, 66, color);
  text(ctx, api, value, x, y + 12, size, color, 'center');
}
export function requestGraph(ctx, api, q = 0, back = false) {
  const nodes = {
    new: [270, 525],
    evidence: [960, 350],
    review: [960, 740],
    closed: [1640, 525],
  };
  line(ctx, api, 340, 510, 880, 370, api.C.green, 4);
  line(ctx, api, 340, 550, 880, 720, api.C.cyan, 4);
  line(ctx, api, 1030, 370, 1560, 505, api.C.green, 4);
  line(ctx, api, 1030, 720, 1560, 550, api.C.cyan, 4);
  ownedState(ctx, api, 'new', ...nodes.new, api.C.yellow, back ? '' : 'no verified evidence');
  ownedState(ctx, api, 'evidence', ...nodes.evidence, api.C.green, back ? '' : 'verified evidence');
  ownedState(ctx, api, 'review', ...nodes.review, api.C.cyan, back ? '' : 'reviewer queue');
  ownedState(ctx, api, 'closed', ...nodes.closed, api.C.muted, 'future value 0');
  text(ctx, api, 'REQ-10234', 270, 280, 38, api.C.yellow, 'center');
  if (back === true) {
    moveValue(ctx, api, '70', [960, 480], [450, 430], q, api.C.green);
    moveValue(ctx, api, '80', [960, 620], [420, 620], q, api.C.cyan);
  } else if (!back) {
    const from = q < 0.5 ? nodes.new : nodes.evidence,
      to = q < 0.5 ? nodes.evidence : nodes.closed;
    moveValue(
      ctx,
      api,
      'R-10234',
      [from[0], from[1] - 170],
      [to[0], to[1] - 170],
      q < 0.5 ? q * 2 : (q - 0.5) * 2,
      api.C.yellow,
      24,
    );
  }
  return nodes;
}
export function backupHeading(ctx, api, label, [evidenceX, evidenceY]) {
  text(ctx, api, label, evidenceX, evidenceY - 120, 37, api.C.yellow, 'center');
}
