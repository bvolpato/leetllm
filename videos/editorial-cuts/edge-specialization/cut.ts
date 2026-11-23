import { film, text, rect, fadeIn, to, line } from 'vizmatic/stage';
export default film({ title: 'An offline service call', look: 'midnight', fps: 30 }, (s) => {
  const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const bar = (w: number, h: number, x: number, y: number, color: string) =>
    rect(w, h, { fill: color, stroke: null, radius: 4 }).at(x, y);
  const housing = rect(1050, 640, { fill: 'surface', stroke: 'dim', width: 5, radius: 54 });
  s.add(
    housing,
    label('Field handheld', -270, -245, 45),
    label('Offline', 361, -245, 40, 'yellow'),
  );
  s.wait(2);
  s.play(fadeIn([label('SENSOR  A', -290, -105, 46, 'teal'), label('E2', -315, 28, 136, 'teal')]), {
    duration: 0.5,
  });
  s.wait(2);
  s.play(
    fadeIn([
      label('Stored manual   M7', 200, -95, 45),
      bar(6, 192, -75, 0, 'dim'),
      label('E2   Battery low', 208, 24, 48),
    ]),
    { duration: 0.55 },
  );
  s.wait(2);
  s.play(fadeIn(label('Sensor A reports a low battery.', 0, 206, 53, 'teal')), { duration: 0.5 });
  s.wait(9.437);
});
