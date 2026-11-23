import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film({ title: 'Carry one event into the new chat', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const heading = label('One invoice failure, two sessions', 0, -365, 80);
  const event = label('Event 78291', -495, -65, 65, 'blue');
  const command = label('pnpm test --run billing', -495, 48, 40);
  const ticket = rect(690, 240, { fill: 'surface', stroke: 'blue', width: 4, radius: 16 }).at(
    -495,
    0,
  );
  const day = label('Original session', -495, -210, 44);
  const source = label('Billing verification log', -495, 190, 37, 'dim');
  const next = label('New session · four days later', 485, -210, 44);
  const prompt = label('“Same failure. Continue.”', 485, 0, 55);
  s.add(heading, day, ticket, event, command, source);
  s.wait(4.5);
  s.play(fadeIn(next), fadeIn(prompt), { duration: 0.5 });
  s.wait(8.8);
  const path = line([-120, 0], [80, 0], { stroke: 'blue', width: 5 });
  s.play(fadeOut(prompt), fadeIn(path), { duration: 0.4 });
  const record = [ticket, event, command];
  s.play(...record.map((n) => to(n, (m) => m.shift(980, 0))), { duration: 1.4 });
  const ref = label('Source · billing verification log', 485, 190, 37, 'blue');
  s.play(fadeIn(ref), { duration: 0.4 });
  s.wait(8.75);
});
