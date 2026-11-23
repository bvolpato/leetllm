import { connector, line, text } from './defaults.mjs';

// Keep the catalogue coordinates stable when the edition changes at the end.
export function catalogSlip(ctx, api, scene, { id, x, y, label, title, detail, color }) {
  const w = 650;
  return api.focus.target(scene + '-' + id, () => {
    api.rect(ctx, x, y, w, 214, api.C.panel, color, 10);
    line(ctx, api, x + 24, y + 67, x + w - 24, y + 67, color, 2);
    text(ctx, api, scene, label, x + 30, y + 47, 30, color);
    text(ctx, api, scene, title, x + 30, y + 131, 46, api.C.ink);
    text(ctx, api, scene, detail, x + 30, y + 185, 32, color);
  });
}

export function followBookRecord(ctx, api, progress) {
  if (progress <= 0) return;
  const color = api.C.cyan;
  line(ctx, api, 783, 552, 783 + 157 * Math.min(1, progress * 3), 552, color, 5);
  if (progress > 1 / 3)
    line(ctx, api, 940, 552, 940, 552 - 155 * Math.min(1, progress * 3 - 1), color, 5);
  connector(ctx, api, 940, 397, 1128, 397, Math.max(0, progress * 3 - 2), color);
}
