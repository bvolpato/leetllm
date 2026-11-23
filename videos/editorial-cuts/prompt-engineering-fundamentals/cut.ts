import { film, text, line, type ColorInput } from 'vizmatic/stage';
export default film({ title: 'When does IR-7 say to page?', look: 'midnight', fps: 30 }, (s) => {
  let elapsed = 0;
  function at(t: number) {
    if (t > elapsed) s.wait(t - elapsed);
    elapsed = Math.max(elapsed, t);
  }
  function show(v: string, x: number, y: number, size: number, color: ColorInput = 'ink') {
    s.add(text(v, { size, color }).at(x, y));
  }
  show('When does IR-7 say to page?', 0, -370, 83);

  const axisY = 62;
  s.add(line([-710, axisY], [710, axisY], { stroke: 'dim', width: 4 }));
  for (let i = 0; i < 4; i++) {
    const x = -710 + i * 470;
    s.add(line([x, 47], [x, 79], { stroke: 'dim', width: 4 }));
    show(String(i * 30), x, 135, 54);
  }
  show('minutes', 0, 245, 44);
  at(1.4);
  s.add(line([700, 35], [700, -80], { stroke: 'yellow', width: 8 }));
  show('Assistant', 640, -142, 56, 'yellow');
  at(7.4);
  s.add(line([-240, 35], [-240, -80], { stroke: 'teal', width: 8 }));
  show('Runbook IR-7', -240, -142, 56, 'teal');
  at(10.4);
  s.add(line([-240, -12], [700, -12], { stroke: 'yellow', width: 5 }));
  show('60-minute gap', 220, -75, 48, 'yellow');
  at(15);
  show('Ground the next prediction in the rule.', 0, 335, 54);

  at(24.5);
});
