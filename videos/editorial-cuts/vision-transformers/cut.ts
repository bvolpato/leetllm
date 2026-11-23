import { film, rect, text, fadeIn, line } from 'vizmatic/stage';

export default film(
  { title: 'Which edge carries the blue pixel?', fps: 30, look: 'midnight' },
  (s) => {
    const label = (value: string, x: number, y: number, size = 42) =>
      text(value, { size, font: 'mono' }).at(x, y);
    s.add(text('Can you see which pixel is blue?', { size: 80, font: 'text-serif' }).at(0, -388));
    const colors = ['#343c48', '#eee8dc', '#ef94b5', '#69baff'];
    const field = (
      x: number,
      y: number,
      pitch: number,
      side: number,
      colorAt: (r: number, c: number) => number,
    ) =>
      Array.from({ length: side * side }, (_, i) => {
        const r = Math.floor(i / side),
          c = i % side;
        return rect(pitch - 2, pitch - 2, { fill: colors[colorAt(r, c)], stroke: null }).at(
          x + c * pitch,
          y + r * pitch,
        );
      });
    const sample = (r: number, c: number) =>
      r === 6 && c === 7 ? 3 : r === 6 && c === 6 ? 2 : r >= 2 && r < 6 && c >= 2 && c < 6 ? 1 : 0;
    s.add(...field(-650, -195, 61, 8, sample), label('Input pixels', -437, 355));
    s.wait(3.4);
    const outline = rect(126, 126, { fill: null, stroke: '#ffcf69', width: 5 }).at(
      -650 + 6.5 * 61,
      -195 + 6.5 * 61,
    );
    s.play(fadeIn(outline), { duration: 0.35 });
    s.wait(1.35);
    const patch = field(190, -95, 174, 2, (r, c) => sample(r + 6, c + 6));
    s.play(
      fadeIn([
        line([-180, 157], [90, -110], { stroke: '#ffcf69', width: 3 }),
        line([-180, 260], [90, 170], { stroke: '#ffcf69', width: 3 }),
        ...patch,
      ]),
      { duration: 0.65 },
    );
    s.add(label('Same four pixels', 277, 355));
    s.wait(6.2);
    s.play(
      fadeIn([
        text('pink', { size: 34, color: '#151c28' }).at(190, -95),
        text('blue', { size: 34, color: '#151c28' }).at(364, -95),
      ]),
      { duration: 0.4 },
    );
    s.wait(6.65);
  },
);
