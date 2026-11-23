// The two columns follow the same incident from the draft to the reader's update.
export function incidentSheet(ctx, api) {
  const { C } = api;
  const left = 128,
    right = 1040;
  const text = (value, x, y, size = 40, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, value, x, y, size, color, align, font);
  function heading(x, name, detail, color) {
    text(name, x, 251, 46, color, 'left', 'serif');
    text(detail, x, 310, 30, C.muted);
    api.line(ctx, x, 335, x + 746, 335, C.muted, 2);
  }
  function pair(y, name, value, color = C.ink) {
    text(name, left, y, 30, C.muted);
    text(value, left, y + 55, 43, color);
  }
  function link(y, fraction, color = C.green) {
    if (fraction <= 0) return;
    const end = api.lerp(852, 1002, fraction);
    api.line(ctx, 852, y, end, y, color, 4);
    api.circle(ctx, end, y, 7, color);
  }
  function footer(value, color = C.ink) {
    api.line(ctx, left, 869, 1786, 869, C.muted, 2);
    text(value, left, 958, 43, color, 'left', 'serif');
  }
  return { C, left, right, text, heading, pair, link, footer };
}

// Provider timing controls the delivered cut. The fallback also lets untimed stills be inspected.
export function phraseProgress(state, api, cue, beat, from = 0.08, to = 0.72) {
  if (state.cues?.[cue]) return api.focus.progress(cue, 0);
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return api.phase(state.beatP ?? 0, from, to);
}
