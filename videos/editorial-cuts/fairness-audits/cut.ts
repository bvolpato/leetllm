import { film, text, line, dot, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Who gets the fast path?', look: 'midnight' }, (s) => {
  s.add(text('Who gets the fast path?', { font: 'text-serif', size: 72 }).at(0, -460));
  s.add(line([-820, -395], [820, -395], { stroke: 'gridStrong', width: 2 }));
  s.play(
    fadeIn(text('Broken blender    ·    day 12 of 30', { size: 40, color: 'dim' }).at(0, -310)),
    { duration: 0.26 },
  );
  s.wait(4.54);
  s.play(fadeIn(text('Formal', { size: 52, color: 'ink' }).at(328, -110)), { duration: 0.26 });
  s.wait(1.44);
  s.play(fadeIn(text('0.78', { size: 52, color: 'ink' }).at(328, 15)), { duration: 0.26 });
  s.wait(1.84);
  s.play(fadeIn(text('Conversational', { size: 52, color: 'ink' }).at(-328, -110)), {
    duration: 0.26,
  });
  s.wait(1.14);
  s.play(fadeIn(text('0.67', { size: 52, color: 'ink' }).at(-328, 15)), { duration: 0.26 });
  s.wait(2.84);
  s.add(line([-745, 192], [745, 192], { stroke: 'gridStrong', width: 4 }));
  const scoreX = (score: number) => -745 + ((score - 0.6) / 0.25) * 1490;
  s.add(line([scoreX(0.7), 171], [scoreX(0.7), 220], { stroke: 'yellow', width: 4 }));
  s.add(dot(12, 'blue').at(scoreX(0.78), 192), dot(12, 'purple').at(scoreX(0.67), 192));
  s.play(fadeIn(text('Cutoff   0.70', { size: 52, color: 'ink' }).at(-149, 142)), {
    duration: 0.26,
  });
  s.wait(2.54);
  s.play(fadeIn(text('Automatic resolution', { size: 52, color: 'teal' }).at(328, 285)), {
    duration: 0.26,
  });
  s.wait(2.54);
  s.play(fadeIn(text('Human review', { size: 52, color: 'teal' }).at(-328, 285)), {
    duration: 0.26,
  });
  s.wait(4.495);
});
