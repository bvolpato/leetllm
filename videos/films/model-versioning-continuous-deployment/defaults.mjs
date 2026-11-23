import { CANDIDATE, STABLE, releaseId } from './model.mjs';
export function originalCueComplete(ctx, api, id) {
  return api.focus.cue(id)?.phase === 'after';
}
export function legacyText(ctx, api, v, x, y, z = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function recordCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 450,
  color = api.C.blue,
  height = 110,
  z = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 16,
  });
}
export function recordGrid(ctx, api, labels, x, y, width, height, z = 30) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: z,
    fill: api.C.panel,
    stroke: api.C.blue,
    textColor: api.C.ink,
  });
}
export function releaseName(ctx, api, id) {
  return id === STABLE ? 'STABLE' : id === CANDIDATE ? 'CANDIDATE' : id.slice(0, 12);
}
export function releaseBundle(
  ctx,
  api,
  manifest,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  compact = false,
) {
  return api.focus.target('release-bundle', () =>
    api.components.panel(
      {
        x,
        y,
        width,
        height: compact ? 245 : 385,
        fill: api.C.panel,
        stroke: color,
        padding: 22,
      },
      () => {
        legacyText(ctx, api, label, x + width / 2, y + 55, 34, color, 'center');
        legacyText(
          ctx,
          api,
          releaseId(manifest).slice(0, 16),
          x + width / 2,
          y + 113,
          31,
          color,
          'center',
        );
        if (compact) {
          legacyText(
            ctx,
            api,
            'prompt ' + manifest.prompt.slice(0, 12),
            x + width / 2,
            y + 174,
            25,
            api.C.ink,
            'center',
          );
          legacyText(
            ctx,
            api,
            'runtime ' + manifest.runtime.slice(0, 12),
            x + width / 2,
            y + 216,
            25,
            api.C.ink,
            'center',
          );
        } else {
          legacyText(
            ctx,
            api,
            'model · teaching-pin',
            x + width / 2,
            y + 181,
            28,
            api.C.ink,
            'center',
          );
          legacyText(
            ctx,
            api,
            'prompt ' + manifest.prompt.slice(0, 12),
            x + width / 2,
            y + 235,
            27,
            api.C.ink,
            'center',
          );
          legacyText(
            ctx,
            api,
            'runtime ' + manifest.runtime.slice(0, 12),
            x + width / 2,
            y + 289,
            27,
            api.C.ink,
            'center',
          );
          legacyText(
            ctx,
            api,
            manifest.schema + ' · ' + manifest.evaluator,
            x + width / 2,
            y + 347,
            25,
            api.C.muted,
            'center',
          );
        }
      },
    ),
  );
}
export function chapterText(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'center') {
  return api.text(ctx, String(v), x, y, z, col, a);
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 8);
}
export function segment(ctx, api, x, y, u, v, col = api.C.border, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function pill(ctx, api, v, x, y, w = 430, col = api.C.blue, h = 72, z = 29) {
  rectangle(ctx, api, x - w / 2, y - h / 2, w, h, api.C.panel, col);
  chapterText(ctx, api, v, x, y + z * 0.34, z, col);
}
export function footer(ctx, api, v, col = api.C.muted) {
  return chapterText(ctx, api, v, 960, 1020, 26, col);
}
export function formatDecimal(ctx, api, v, n = 3) {
  return Number(v).toFixed(n);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.blue) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function releaseDigest(ctx, api, v, x, y, col = api.C.cyan) {
  return chapterText(ctx, api, v.slice(0, 20), x, y, 28, col);
}
export function centeredLine(ctx, api, text, y, col = api.C.muted) {
  return chapterText(ctx, api, text, 960, y, 30, col);
}
export function bundleToken(ctx, api, label, x, y, col = api.C.cyan) {
  rectangle(ctx, api, x - 220, y - 66, 440, 132, api.C.panel, col);
  chapterText(ctx, api, label, x, y - 15, 31, col);
  releaseDigest(ctx, api, label === 'STABLE' ? STABLE : CANDIDATE, x, y + 39, col);
}
export function valueStrip(ctx, api, vals, x, y, w = 100, h = 62, col = api.C.blue) {
  return vals.forEach((v, i) => {
    rectangle(ctx, api, x + i * w, y, w - 9, h, api.C.panel, col);
    chapterText(ctx, api, v, x + i * w + (w - 9) / 2, y + h * 0.65, 27, col);
  });
}
