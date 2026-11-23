// The page margin and rule baselines stay fixed while evidence changes.
export function desk(ctx, api) {
  const { C } = api;
  const ink = (value, x, y, size = 36, color = C.ink, align = 'left', family = 'sans') =>
    api.text(ctx, value, x, y, size, color, align, family);
  const rule = (x1, y1, x2, y2, color = C.muted, width = 2) =>
    api.line(ctx, x1, y1, x2, y2, color, width);
  const sheet = (x, y, w, h, label, color = C.blue) => {
    api.rect(ctx, x, y, w, h, C.panel, color, 4);
    ink(label, x + 32, y + 51, 29, color);
    rule(x + 32, y + 76, x + w - 32, y + 76, color, 1);
  };
  const pair = (x, y, first, second, color = C.ink) => {
    ink(first, x, y, 39, color, 'left', 'serif');
    ink(second, x, y + 55, 32, color);
  };
  return { C, ink, rule, sheet, pair, focus: api.focus.target, progress: api.focus.progress, visible: api.focus.visible };
}

export function said(state, cue) {
  return state.cues?.[cue]?.phase === 'after';
}
