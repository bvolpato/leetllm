// All drawing goes through the course canvas painter so focus and bounds follow the marks.
export function picture(ctx, state, api) {
  const { C, focus } = api;
  return {
    C,
    label: (value, x, y, size = 36, color = C.ink, align = 'left', font = 'sans') =>
      api.text(ctx, String(value), x, y, size, color, align, font),
    rule: (x, y, x2, y2, color = C.muted, width = 2) => api.line(ctx, x, y, x2, y2, color, width),
    box: (x, y, w, h, fill = C.panel, stroke) => api.rect(ctx, x, y, w, h, fill, stroke, 0),
    dot: (x, y, radius, color) => api.circle(ctx, x, y, radius, color),
    target: (id, paint) => focus.target(id, paint),
    progress: (id) => focus.progress(id),
    started: (id) => focus.visible(id),
    after: (id) => state.cues?.[id]?.phase === 'after',
  };
}
