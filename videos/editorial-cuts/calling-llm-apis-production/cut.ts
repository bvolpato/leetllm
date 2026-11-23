import { film, text, line, dynamic, type ColorInput } from 'vizmatic/stage';
export default film({ title: 'Whose clock stopped?', look: 'midnight', fps: 30 }, (s) => {
  let elapsed = 0;
  function at(t: number) {
    if (t > elapsed) s.wait(t - elapsed);
    elapsed = Math.max(elapsed, t);
  }
  function show(v: string, x: number, y: number, size: number, color: ColorInput = 'ink') {
    s.add(text(v, { size, color }).at(x, y));
  }
  show('Whose clock stopped?', 0, -370, 83);

  show('Client', -690, -94, 58);
  show('Provider', -690, 122, 58);
  const length = s.value(0),
    limit = 675;
  s.add(
    dynamic(() =>
      line([-450, -94], [-450 + Math.max(1, Math.min(limit, length.value)), -94], {
        stroke: 'teal',
        width: 12,
      }),
    ),
  );
  s.add(
    dynamic(() =>
      line([-450, 122], [-450 + Math.max(1, length.value), 122], { stroke: 'blue', width: 12 }),
    ),
  );
  at(1.4);
  s.play(length.to(limit, { duration: 3.8 }));
  show('timeout', 240, -180, 54, 'yellow');
  s.play(length.to(1160, { duration: 3.8 }));
  show('may still be running', 370, 205, 54, 'blue');
  elapsed = 9;
  at(13.2);
  show('Next case: a 45-day-old credential', 0, 320, 52);

  at(16);
});
