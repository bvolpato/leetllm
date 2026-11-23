import { film, text, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Who gets the empty seat?', look: 'midnight' }, (s) => {
  const head = text('Three requests share one step.', { font: 'text-serif', size: 74 }).at(0, -370);
  const labels = ['A   Definition', 'B   Paragraph', 'C   Explanation'];
  const colors = ['blue', 'teal', 'purple'] as const;
  const lengths = [2, 4, 6];
  s.add(head);
  const seats = labels.map((name, i) => {
    const y = -180 + i * 135;
    const label = text(name, { size: 46, color: colors[i] }).at(-485, y);
    const marks = Array.from({ length: lengths[i] }, (_, j) =>
      rect(74, 62, { radius: 9, fill: 'surface', stroke: colors[i], width: 3 }).at(
        -115 + j * 98,
        y,
      ),
    );
    const active = marks
      .slice(0, 2)
      .map((_, j) => rect(69, 57, { radius: 8, fill: colors[i] }).at(-115 + j * 98, y));
    return { label, marks, active };
  });
  for (const seat of seats) {
    s.play(fadeIn([seat.label, ...seat.marks]), { duration: 0.45 });
    s.wait(0.85);
  }
  s.wait(1.2);
  for (let step = 0; step < 2; step++) {
    s.play(fadeIn(seats.map((seat) => seat.active[step])), { duration: 0.45 });
    s.wait(1);
  }
  const done = text('Done', { size: 46, color: 'blue' }).at(565, -180);
  s.play(fadeIn(done), { duration: 0.35 });
  s.wait(1.8);
  const question = text('Who takes seat A next?', { font: 'text-serif', size: 62 }).at(0, 305);
  s.play(fadeIn(question), { duration: 0.5 });
  s.wait(5.217);
});
