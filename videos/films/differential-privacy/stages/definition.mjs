import { privacyEventBand } from '../arithmetic.mjs';

export function drawDefinition(ctx, scene, state, api) {
  const { C, focus } = api;
  const q = 0.001, candidate = 0.0017;
  const epsilon = 0.5 * focus.progress('allow-ratio', 0);
  const delta = 0.0001 * focus.progress('add-slack', 0);
  const band = privacyEventBand(epsilon, delta, q);
  const pure = privacyEventBand(epsilon, 0, q);
  const left = 230, right = 1700, y = 645;
  const x = (value) => left + (right - left) * value / 0.002;
  const text = (value, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, px, py, size, color, align);
  focus.target('event-ruler', () => {
    text('Event   ·   released total ≥ 2', left, 265, 43);
    text('Without Alice     q = 0.001', left, 365, 36, C.blue);
    text('With Alice     probability p', left, 430, 36, C.cyan);
    text('ε = ' + epsilon.toFixed(2) + '     δ = ' + delta.toFixed(4), right, 365, 36, C.yellow, 'right');
    text('p ≤ exp(ε) q + δ', right, 430, 33, C.ink, 'right');
    text('q ≤ exp(ε) p + δ', right, 480, 33, C.ink, 'right');
    api.line(ctx, left, y, right, y, C.muted, 3);
    function span(a, b, color) {
      if (b > a) api.rect(ctx, x(a), y - 21, x(b) - x(a), 42, color, undefined, 0);
    }
    span(band.lower, pure.lower, C.yellow);
    span(pure.lower, pure.upper, C.cyan);
    span(pure.upper, band.upper, C.yellow);
    for (const value of [0, 0.0005, q, 0.0015, 0.002]) {
      api.line(ctx, x(value), y + 28, x(value), y + 42, C.muted, 3);
      text(String(value), x(value), y + 86, 30, C.muted, 'center');
    }
    api.line(ctx, x(q), y - 48, x(q), y + 23, C.blue, 5);
    text('q', x(q), y - 65, 35, C.blue, 'center');
    const testing = state.beat >= 2;
    if (testing) {
      api.circle(ctx, x(candidate), y, 12, C.pink);
      api.line(ctx, x(candidate), y - 18, x(candidate), y - 55, C.pink, 3);
      text('p = 0.0017', x(candidate), y - 75, 35, C.pink, 'center');
    }
    text('Allowed p for this event', 560, 832, 33, C.muted, 'right');
    text(band.lower.toFixed(6) + '   to   ' + band.upper.toFixed(6) + '   (rounded)', 620, 833, 39, C.cyan);
    const note = state.beat >= 3 && delta === 0.0001 ? 'Inside this event’s band. Check every event on every neighboring pair.'
      : state.beat === 2 ? 'Does 0.0017 fit when δ is zero?' : 'Fix both datasets. Repeat only the randomized release.';
    text(note, 960, 969, 34, C.ink, 'center');
  });
}
export default { id: 'definition', draw: drawDefinition, cues: ['fix-event', 'allow-ratio', 'test-event', 'add-slack'] };
