import { cueAt } from '../cue-clock.mjs';

const candidate = (x) => (x <= 3 ? 2 * x : 0);
export function drawVerifierBoundaries(ctx, scene, state, api) {
  api.focus.target('verifier-boundaries-mechanism', () => {
    const { C, text, line } = api;
    if (state.beat === 2) {
      const rows = [
        ['Confident scan claim', 'Compare the scan field with its source.'],
        ['Longer reasoning', 'Compare action errors and token usage.'],
        ['Empty decision record', 'Check whether the output budget ran out.'],
      ];
      rows.forEach(([name, action], i) => {
        const y = 380 + 222 * i;
        text(ctx, name, 175, y, 42, C.blue);
        text(ctx, action, 815, y, 41, C.ink);
        line(ctx, 175, y + 51, 1750, y + 51, C.muted, 2);
      });
      return;
    }
    const checked = cueAt(state, 'verifier-tests', 0, 0.32, 0.57).progress;
    const fourth = cueAt(state, 'verifier-four', 0, 0.63, 0.82).started;
    const zero = cueAt(state, 'verifier-zero', 1, 0, 0.06).done;
    const expected = cueAt(state, 'verifier-expected', 1, 0.07, 0.14).done;
    text(ctx, 'Candidate', 170, 274, 35, C.muted);
    text(ctx, '2 * x if x <= 3 else 0', 540, 280, 45, C.ink, 'left', 'mono');
    line(ctx, 170, 328, 1750, 328, C.muted, 2);
    const headings = ['Input', 'Expected (2 × input)', 'Observed'];
    const centers = [310, 900, 1500];
    headings.forEach((name, i) => text(ctx, name, centers[i], 440, 37, C.muted, 'center'));
    [1, 2, 3, 4].forEach((x) => {
      if (x === 4 && !fourth) return;
      const y = 553 + (x - 1) * 112;
      const ran = x === 4 ? zero : checked * 3 >= x;
      const value = candidate(x);
      text(ctx, String(x), centers[0], y, 47, C.ink, 'center');
      text(ctx, x === 4 && !expected ? '2 × 4' : String(2 * x), centers[1], y, 47, C.ink, 'center');
      text(
        ctx,
        ran ? String(value) : '?',
        centers[2],
        y,
        47,
        ran ? (value === 2 * x ? C.green : C.pink) : C.yellow,
        'center',
      );
    });
  });
}
export default {
  id: 'verifier-boundaries',
  draw: drawVerifierBoundaries,
  cues: [
    'verifier-tests',
    'verifier-four',
    'verifier-zero',
    'verifier-expected',
    'verifier-checks',
  ],
};
