import { spoken } from '../arithmetic.mjs';
import { rooflineFixture } from '../model.mjs';

const first = rooflineFixture(12);
const second = rooflineFixture(16);

// Both axes are logarithmic. Positions use FLOP/byte and TFLOP/s.
const x = (intensity) => 290 + (Math.log10(intensity) + 1) * 440;
const y = (rate) => 700 - (Math.log10(rate) + 1) * 102;
const rate = (intensity) => Math.min(first.peak, first.bandwidth * intensity) / 1e12;

export function drawRoofline(ctx, scene, state, api) {
  const { C, text, line, circle, rect } = api;
  const travel = spoken(state, 'sixteen-byte-floor', 2);
  const bytes = first.bytesPerElement + (second.bytesPerElement - first.bytesPerElement) * travel;
  const intensity = first.operations / (first.n * bytes);
  api.focus.target('roofline-mechanism', () => {
    text(ctx, 'Example GPU     3 TB/s device memory     ·     60 TFLOP/s peak compute', 140, 237, 36, C.ink);
    text(ctx, 'TFLOP/s', 290, 342, 32, C.muted);
    for (const tick of [0.1, 1, 10, 100]) {
      line(ctx, x(tick), y(100), x(tick), y(0.1), C.muted, 1);
      text(ctx, String(tick), x(tick), 748, 31, C.muted, 'center');
      line(ctx, x(0.1), y(tick), x(100), y(tick), C.muted, 1);
      text(ctx, String(tick), 253, y(tick) + 10, 31, C.muted, 'right');
    }
    text(ctx, 'Arithmetic intensity (FLOP/byte)', 950, 795, 32, C.muted, 'center');
    api.path(ctx, [0.1, first.ridge, 100].map(i => ({ x: x(i), y: y(rate(i)) })), { color: C.cyan, width: 6 });
    if (spoken(state, 'earned-intensity', 0) > 0) {
      if (travel > 0) circle(ctx, x(first.intensity), y(rate(first.intensity)), 12, C.bg, C.blue, 4);
      circle(ctx, x(intensity), y(rate(intensity)), 13, C.yellow);
      const quotient = bytes === first.bytesPerElement ? ' ≈ ' + first.intensity.toFixed(3) : ' = ' + second.intensity;
      if (travel === 0 || travel === 1)
        text(ctx, '2 FLOP / ' + bytes + ' B' + quotient + ' FLOP/B', 520, 340, 33, C.yellow);
      if (spoken(state, 'toy-roof', 1) === 1 && (travel === 0 || travel === 1))
        text(ctx, rate(intensity) + ' TFLOP/s ceiling', 1610, 340, 34, C.yellow, 'right');
    }
    if (state.beat !== 2) {
      text(ctx, 'One output', 150, 924, 38, C.ink);
      ['Read X   4 B', 'Read Z   4 B', 'Write Y   4 B'].forEach((label, i) => {
        const left = 450 + i * 400;
        rect(ctx, left, 851, 380, 104, C.panel, i === 2 ? C.cyan : C.blue, 8);
        text(ctx, label, left + 190, 920, 39, i === 2 ? C.cyan : C.blue, 'center');
      });
      return;
    }
    const floorRow = (fixture, top, progress, color, showTime) => {
      text(ctx, fixture.bytesPerElement + ' B/element', 150, top + 36, 34, color);
      const length = 935 * fixture.idealUs / second.idealUs;
      if (progress > 0) rect(ctx, 452, top, length * progress, 42, color, undefined, 5);
      if (showTime) text(ctx, '≈ ' + fixture.idealUs.toFixed(2) + ' µs minimum', 1760, top + 36, 35, color, 'right');
    };
    const floor = spoken(state, 'traffic-floor', 2);
    floorRow(first, 842, floor, C.blue, floor === 1);
    if (travel > 0) floorRow(second, 949, travel, C.yellow, spoken(state, 'longer-floor', 2) === 1);
  });
}
export default {
  id: 'roofline',
  draw: drawRoofline,
  cues: ['earned-intensity', 'toy-roof', 'traffic-floor', 'sixteen-byte-floor', 'longer-floor'],
};
