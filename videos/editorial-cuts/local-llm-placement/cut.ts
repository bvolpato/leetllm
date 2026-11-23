import { film, text, rect, fadeIn, to, line } from 'vizmatic/stage';
export default film(
  { title: 'Why a loaded model runs out of room', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const bar = (w: number, h: number, x: number, y: number, color: string) =>
      rect(w, h, { fill: color, stroke: null, radius: 4 }).at(x, y);
    s.add(label('The model loaded. Will this request fit?', 0, -355, 76));
    const left = -730,
      limit = 490,
      y = 20;
    s.add(
      line([left, y + 75], [790, y + 75], { stroke: 'dim', width: 3 }),
      line([limit, -180], [limit, 160], { stroke: 'yellow', width: 5 }),
      label('Device limit', limit, -240, 44, 'yellow'),
    );
    s.add(bar(445, 120, left + 222.5, y, 'blue'), label('Weights', left + 222.5, y, 48, 'surface'));
    const first = bar(120, 120, left + 505, y, 'teal');
    s.play(fadeIn(first), { duration: 0.5 });
    s.add(label('Short request', -190, 165, 42));
    s.wait(2.6);
    const logs = bar(616, 120, left + 565 + 308, y, 'teal');
    s.play(fadeIn(logs), { duration: 0.8 });
    s.add(label('Concurrent long logs', 62, 238, 50, 'teal'));
    s.wait(1.5);
    s.play(
      fadeIn([
        bar(160, 120, left + 1181 + 80, y, 'purple'),
        label('Workspace', 659, 165, 42, 'purple'),
      ]),
      { duration: 0.6 },
    );
    s.wait(1.1);
    s.play(fadeIn(label('Allocations exceed the device limit', 0, 330, 54, 'yellow')), {
      duration: 0.5,
    });
    s.wait(10.512);
  },
);
