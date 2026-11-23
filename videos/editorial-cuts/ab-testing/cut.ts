import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'Would you authorize this rollback?', look: 'midnight' }, (s) => {
  const words = (label: string, x: number, y: number, size = 48, color = 'ink') =>
    text(label, { size, color }).at(x, y);
  s.add(words('Would you authorize this rollback?', 0, -380, 71));
  s.add(
    words('Outcome to measure', 0, -200, 44, 'blue'),
    words('More incidents resolved within the budgets', 0, -110, 58),
  );
  s.wait(8);
  s.play(
    fadeIn(words('Runbook', -500, 80, 45, 'blue')),
    fadeIn(words('Rollback requires owner acknowledgement.', 0, 165, 49)),
    { duration: 0.5 },
  );
  s.wait(5);
  s.play(
    fadeIn(words('Candidate answer', -480, 275, 45, 'yellow')),
    fadeIn(words('Acknowledgement alone authorizes rollback.', 0, 357, 49)),
    { duration: 0.5 },
  );
  s.wait(4.5);
  const sentence = 'Acknowledgement alone authorizes rollback.';
  const width = (value: string) => text(value, { size: 49 }).bounds().width;
  const endOfWord = -width(sentence) / 2 + width('Acknowledgement alone');
  s.play(
    draw(line([endOfWord - width('alone'), 393], [endOfWord, 393], { stroke: 'yellow', width: 5 })),
    { duration: 0.4 },
  );
  s.add(words('A prerequisite became permission.', 0, -285, 49, 'yellow'));
  s.wait(9.2);
});
