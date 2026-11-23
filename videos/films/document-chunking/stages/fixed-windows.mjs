import { fixedWindows, cueProgress } from '../arithmetic.mjs';
import { RUNBOOK } from '../fixtures.mjs';

export function drawFixedWindows(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const at = (id, a, b) => cueProgress(state, id, api.phase(p, a, b));
  const [first, second] = fixedWindows(RUNBOOK, 6, 2);
  const words = RUNBOOK.split(/\s+/).slice(first.start, second.end);
  api.focus.target('window-page', () => {
    const cell = 158;
    const x = (i) => 168 + i * cell;
    text(ctx, 'Paging rule  /  first 10 words of the 17-word page', x(0), 270, 32, C.muted);
    words.forEach((word, i) => {
      text(ctx, word, x(i + 0.5), 425, 42, C.ink, 'center');
      text(ctx, String(i + 1), x(i + 0.5), 480, 27, C.muted, 'center');
    });
    const firstIn = beat > 0 ? 1 : at('six-places', 0.04, 0.50);
    const secondIn = beat > 1 ? 1 : beat === 1 ? at('slide-four', 0.28, 0.66) : 0;
    const brackets = [{ start: first.start, end: first.end, color: C.blue, y: 518, u: firstIn }];
    if (secondIn > 0) brackets.push({
      start: first.start + secondIn * (second.start - first.start),
      end: first.end + secondIn * (second.end - first.end),
      color: C.cyan, y: 568, u: 1,
    });
    for (const { start, end, color, y, u } of brackets) {
      if (u <= 0) continue;
      const right = x(start + (end - start) * u) - 4;
      line(ctx, x(start), y, right, y, color, 5);
      line(ctx, x(start), y - 15, x(start), y + 9, color, 4);
      line(ctx, right, y - 15, right, y + 9, color, 4);
    }
    if (beat === 0) {
      text(ctx, 'What unit of time could you cite from the first six words?', 960, 777, 46, C.yellow, 'center');
      return;
    }
    const excerpts = [first, second];
    for (const [i, hit] of excerpts.entries()) {
      if (i && secondIn < 1) continue;
      const y = 671 + i * 117;
      const color = i ? C.cyan : C.blue;
      text(ctx, 'Words ' + (hit.start + 1) + '–' + hit.end, x(0), y + 51, 29, color);
      rect(ctx, x(2), y, 1258, 83, C.panel, color, 4);
      text(ctx, hit.text, x(2) + 33, y + 56, 43, C.ink);
    }
    if (beat > 1) text(ctx, 'Next start = 1 + (6 − 2) = 5', 960, 976, 40, C.yellow, 'center');
  });
}

export default {
  id: 'fixed-windows', draw: drawFixedWindows, cues: ['six-places', 'slide-four'],
};
