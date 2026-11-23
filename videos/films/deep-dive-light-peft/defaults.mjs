import { clamp01 } from './arithmetic.mjs';
export function originalText(ctx, api, C, value, x, y, size = 31, color = C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function originalMath(
  ctx,
  api,
  C,
  value,
  x,
  y,
  size = 44,
  color = C.yellow,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function originalCard(
  ctx,
  api,
  C,
  label,
  x,
  y,
  width,
  height = 104,
  color = C.cyan,
  fontSize = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 13,
  });
}
export function pairedCoordinates(
  ctx,
  api,
  C,
  x,
  y,
  ids,
  kept,
  progress,
  focus = null,
  up = 'Up output rows',
  down = 'Down input columns',
  height = 65,
  dimensionOffset = 355,
  inputWidth = 2,
  selectionKnown = true,
) {
  const width = 80,
    left = x,
    right = x + 340;
  const upCenter = left + (inputWidth * width) / 2;
  originalText(ctx, api, C, up, upCenter, y - 35, 25, C.blue, 'center');
  originalText(ctx, api, C, down, right + (ids.length * width) / 2, y - 35, 25, C.cyan, 'center');
  const keptIds = ids.filter((id) => kept.includes(id));
  ids.forEach((id, index) => {
    const selected = kept.includes(id),
      destination = keptIds.indexOf(id),
      opacity = selected ? 1 : 1 - clamp01(progress * 2),
      compact = clamp01(progress * 2 - 1);
    if (opacity <= 0) return;
    const color = focus === id ? C.yellow : !selectionKnown ? C.cyan : selected ? C.green : C.pink;
    const upY = selected
      ? api.lerp(y + index * height, y + destination * height, compact)
      : y + index * height;
    const downX = selected
      ? api.lerp(right + index * width, right + destination * width, compact)
      : right + index * width;
    api.components.fade(opacity, () => {
      for (let column = 0; column < inputWidth; column++) {
        api.components.panel({
          x: left + column * width,
          y: upY,
          width: width - 5,
          height: height - 5,
          fill: C.panel,
          stroke: color,
        });
        originalText(
          ctx,
          api,
          C,
          id,
          left + column * width + (width - 5) / 2,
          upY + 39,
          23,
          color,
          'center',
        );
      }
      for (let row = 0; row < 2; row++) {
        api.components.panel({
          x: downX,
          y: y + row * height,
          width: width - 5,
          height: height - 5,
          fill: C.panel,
          stroke: color,
        });
        originalText(
          ctx,
          api,
          C,
          id,
          downX + (width - 5) / 2,
          y + row * height + 39,
          23,
          color,
          'center',
        );
      }
    });
  });
  const count = progress === 1 ? kept.length : ids.length;
  originalText(
    ctx,
    api,
    C,
    progress > 0 && progress < 1
      ? 'Rows ' + ids.length + ' → ' + kept.length
      : count + ' × ' + inputWidth,
    upCenter,
    y + dimensionOffset,
    26,
    progress > 0 && progress < 1 ? C.yellow : C.muted,
    'center',
  );
  originalText(
    ctx,
    api,
    C,
    progress > 0 && progress < 1 ? 'Columns ' + ids.length + ' → ' + kept.length : '2 × ' + count,
    right + (count * width) / 2,
    y + dimensionOffset,
    26,
    progress > 0 && progress < 1 ? C.yellow : C.muted,
    'center',
  );
}
export function focusScope(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function chapterText(ctx, api, C, s, x, y, size = 30, color = C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function chapterMath(ctx, api, C, s, x, y, size = 40, color = C.yellow) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function chapterLine(ctx, api, C, x1, y1, x2, y2, color = C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function chapterArrow(ctx, api, C, x1, y1, x2, y2, color = C.yellow, progress = 1) {
  const x = api.lerp(x1, x2, progress),
    y = api.lerp(y1, y2, progress),
    a = Math.atan2(y2 - y1, x2 - x1);
  chapterLine(ctx, api, C, x1, y1, x, y, color, 4);
  if (progress > 0) {
    chapterLine(
      ctx,
      api,
      C,
      x,
      y,
      x - 14 * Math.cos(a - 0.5),
      y - 14 * Math.sin(a - 0.5),
      color,
      4,
    );
    chapterLine(
      ctx,
      api,
      C,
      x,
      y,
      x - 14 * Math.cos(a + 0.5),
      y - 14 * Math.sin(a + 0.5),
      color,
      4,
    );
  }
}
export function chapterPanel(ctx, api, C, label, x, y, w, h = 90, color = C.blue, size = 29) {
  api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: C.panel,
    stroke: color,
  });
  chapterText(ctx, api, C, label, x + w / 2, y + h / 2 + size * 0.32, size, color, 'center');
}
export function chapterMatrix(
  ctx,
  api,
  C,
  values,
  x,
  y,
  label,
  color = C.cyan,
  cell = 70,
  rowIds,
  colIds,
  selectedRows,
  selectedCols,
) {
  chapterText(
    ctx,
    api,
    C,
    label,
    x + (values[0].length * (cell + 6)) / 2,
    y - 26,
    27,
    color,
    'center',
  );
  const result = api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 6,
    format: (v) => (typeof v === 'number' ? Number(v.toFixed(3)).toString() : v),
    style: {
      fill: C.panel,
      stroke: color,
      textColor: color,
      fontSize: Math.min(31, cell * 0.43),
      padding: 5,
      radius: 4,
    },
    cellStyle: (_v, i, j) => ({
      textColor:
        (selectedRows && !selectedRows.includes(i)) || (selectedCols && !selectedCols.includes(j))
          ? C.muted
          : color,
      stroke:
        (selectedRows && !selectedRows.includes(i)) || (selectedCols && !selectedCols.includes(j))
          ? C.muted
          : color,
    }),
  });
  rowIds?.forEach((id, i) =>
    chapterText(
      ctx,
      api,
      C,
      id,
      x - 18,
      y + i * (cell + 6) + cell * 0.62,
      22,
      selectedRows && !selectedRows.includes(i) ? C.muted : color,
      'right',
    ),
  );
  colIds?.forEach((id, j) =>
    chapterText(
      ctx,
      api,
      C,
      id,
      x + j * (cell + 6) + cell / 2,
      y + values.length * (cell + 6) + 23,
      22,
      selectedCols && !selectedCols.includes(j) ? C.muted : color,
      'center',
    ),
  );
  return result;
}
export function chapterVector(ctx, api, C, values, x, y, label, color = C.cyan, cell = 78) {
  return chapterMatrix(
    ctx,
    api,
    C,
    values.map((v) => [v]),
    x,
    y,
    label,
    color,
    cell,
  );
}
export function chapterFooter(ctx, api, C, s, color = C.muted) {
  return chapterText(ctx, api, C, s, 960, 1005, 25, color, 'center');
}
export function chapterSubtitle(ctx, api, C, s) {
  return chapterText(ctx, api, C, s, 960, 260, 31, C.blue, 'center');
}
export function chapterStripe(
  ctx,
  api,
  C,
  values,
  x,
  y,
  label,
  selected = values.map((_, i) => i),
  color = C.cyan,
  w = 125,
  h = 65,
) {
  chapterText(ctx, api, C, label, x, y - 22, 27, color);
  values.forEach((v, i) => {
    const col = selected.includes(i) ? color : C.muted;
    chapterPanel(ctx, api, C, v, x + i * (w + 12), y, w, h, col, 26);
  });
}
