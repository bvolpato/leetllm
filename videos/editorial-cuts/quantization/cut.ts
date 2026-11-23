import { film, text, rect, fadeIn, to, line } from 'vizmatic/stage';
export default film(
  { title: 'One weight error, two activations', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const bar = (w: number, h: number, x: number, y: number, color: string) =>
      rect(w, h, { fill: color, stroke: null, radius: 4 }).at(x, y);
    s.add(
      label('How far does the output move?', 0, -355, 78),
      label('Weight error    0.05', 0, -210, 58, 'blue'),
    );
    const ruler = (y: number) => line([-620, y], [620, y], { stroke: 'dim', width: 3 });
    s.add(
      ruler(-20),
      ruler(230),
      label('Quiet input    × 0.10', -380, -85),
      label('Active input', -440, 165),
    );
    s.wait(3);
    s.play(fadeIn([bar(60, 23, -590, -35, 'teal'), label('0.005', -540, 50, 48, 'teal')]), {
      duration: 0.45,
    });
    s.wait(6.6);
    s.play(fadeIn(label('× 2.00', -155, 165)), { duration: 0.35 });
    s.wait(1);
    s.play(fadeIn([bar(1200, 23, -20, 215, 'yellow'), label('0.100', 580, 305, 48, 'yellow')]), {
      duration: 0.45,
    });
    s.wait(7.465);
  },
);
