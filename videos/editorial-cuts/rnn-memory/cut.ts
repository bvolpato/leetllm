import { film, text, line, dot, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'Carry the actor clue to the end', look: 'midnight', fps: 30 },
  (s) => {
    const words = ['dog', 'chased', 'the', 'cat'];
    const states = [Math.tanh(0.8)];
    for (let i = 1; i < words.length; i++) states.push(Math.tanh(0.9 * states[i - 1]));
    const x = (i: number) => -600 + 400 * i;
    const y = (i: number) => 230 - 460 * states[i];
    const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
      text(value, { size, color }).at(x, y);
    s.add(
      text('Does the last word erase the actor?', { font: 'text-serif', size: 77 }).at(0, -390),
    );
    s.add(
      label('Actor clue', -770, -120, 36),
      line([-720, 230], [720, 230], { stroke: 'dim', width: 2 }),
      label('0', -760, 230, 34),
    );
    for (let i = 0; i < words.length; i++) {
      s.add(
        label(words[i], x(i), -225, 55),
        label(i === 0 ? 'input +0.8' : 'input 0', x(i), -154, 32, 'dim'),
      );
    }
    const marker = dot(13, 'blue').at(x(0), y(0));
    s.add(marker, label(states[0].toFixed(3), x(0), y(0) - 48, 38, 'blue'));
    s.wait(3);
    for (let i = 1; i < words.length; i++) {
      const trail = line([x(i - 1), y(i - 1)], [x(i), y(i)], { stroke: 'blue', width: 3 });
      s.play(
        to(marker, (n) => n.at(x(i), y(i))),
        fadeIn(trail),
        { duration: 0.75 },
      );
      s.play(fadeIn(label(states[i].toFixed(3), x(i), y(i) - 48, 38, 'blue')), { duration: 0.25 });
      s.wait(1.1);
    }
    s.wait(1.6);
    s.play(fadeIn(label('Positive state   →   dog acted', 0, 348, 58, 'blue')), { duration: 0.4 });
    s.wait(4.3);
  },
);
