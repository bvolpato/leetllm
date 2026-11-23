import { dot, fadeIn, film, line, text, to } from 'vizmatic/stage';
export default film({ title: 'Will the museum visit fit?' }, (s) => {
  const label = (v: string, x: number, y: number, size = 42, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(label('Will the visit fit before five?', 0, -370, 76));
  const x = (minutes: number) => -720 + minutes * 8;
  const start = x(0),
    arrive = x(25),
    finish = x(115),
    deadline = x(170);
  s.add(
    line([start, 90], [deadline, 90], { stroke: 'dim', width: 4 }),
    line([deadline, -140], [deadline, 180], { stroke: 'yellow', width: 4 }),
    label('17:00 deadline', deadline, -205, 40, 'yellow'),
  );
  const clock = dot(15, 'blue').at(start, 90);
  s.add(clock, label('14:10', start, 165), label('Bus departs', start, -70));
  s.wait(2.6);
  s.play(
    to(clock, (n) => n.at(arrive, 90)),
    { duration: 1 },
  );
  s.add(label('14:35', arrive, 250), label('25 min', (start + arrive) / 2, 14, 38, 'blue'));
  s.wait(1.8);
  s.play(
    to(clock, (n) => n.at(finish, 90)),
    { duration: 1.6 },
  );
  s.add(
    line([arrive, 90], [finish, 90], { stroke: 'teal', width: 9 }),
    label('90 minutes inside', (arrive + finish) / 2, -65, 48, 'teal'),
    label('16:05', finish, 165),
  );
  s.wait(2.6);
  s.play(fadeIn(label('55 minutes to spare', (finish + deadline) / 2, 315, 44, 'teal')), {
    duration: 0.4,
  });
  s.wait(5.825);
});
