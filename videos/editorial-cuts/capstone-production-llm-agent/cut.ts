import { film, text, rect, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'What did the ticket authorize?', look: 'midnight' }, (s) => {
  const label = (
    v: string,
    x: number,
    y: number,
    size: number,
    color: 'ink' | 'teal' | 'yellow' | 'dim' = 'ink',
  ) => text(v, { size, color }).at(x, y);
  s.add(label('What did the ticket authorize?', 0, -380, 75));
  s.add(rect(850, 360, { fill: 'surface', stroke: 'blue', width: 4, radius: 18 }).at(-390, -45));
  s.add(
    label('SUPPORT TICKET', -390, -163, 32, 'dim'),
    label('What does the policy say', -390, -45, 50),
    label('about a disabled key?', -390, 30, 50),
  );
  s.wait(3.7);
  s.play(fadeIn(label('Cited policy reply', 445, -55, 57, 'teal')), { duration: 0.5 });
  s.add(line([55, -50], [181, -50], { stroke: 'teal', width: 5 }));
  s.wait(3.6);
  s.add(line([-815, 202], [815, 202], { stroke: 'gridStrong', width: 3 }));
  s.play(fadeIn(label('Restore the key?', -445, 315, 52, 'yellow')), { duration: 0.5 });
  s.wait(2.2);
  s.add(label('Operator request  +  approval', 325, 315, 44));
  s.wait(6.3);
});
