import { drawPromptText } from './defaults.mjs';

// A source stripe stays on the page whenever its text is quoted.
export function reportPage(ctx, api, x, y, width, height, source, paint) {
  api.rect(ctx, x, y, width, height, api.C.panel, undefined, 9);
  api.line(ctx, x + 4, y + 8, x + 4, y + height - 8, api.C.blue, 7);
  drawPromptText(ctx, api, source, x + 40, y + 58, 30, api.C.blue);
  api.line(ctx, x + 40, y + 85, x + width - 40, y + 85, api.C.muted, 2);
  paint();
}

// Each square is one percentage point of production traffic.
export function trafficGrid(ctx, api, x, y, pitch, percent, color) {
  for (let i = 0; i < 100; i++) {
    const fill = i < percent ? color : api.C.panel;
    api.rect(
      ctx,
      x + (i % 20) * pitch,
      y + Math.floor(i / 20) * pitch,
      pitch - 6,
      pitch - 6,
      fill,
      i < percent ? color : api.C.muted,
      2,
    );
  }
}
