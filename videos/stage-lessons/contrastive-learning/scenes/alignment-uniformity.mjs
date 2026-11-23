import { circle, dot, dynamic, indicate, place, row } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';

export default function alignmentUniformity(s, c) {
  const [key, picture, foot] = area.rows([1, 6, 1], 'normal');
  const origin = picture.point('center'),
    radius = picture.height * 0.4;
  const spread = s.value(1);
  const pairs = 4;
  const ring = circle(radius, { stroke: 'dim', width: 2 }).moveTo(origin);
  const points = Array.from({ length: pairs * 2 }, (_, i) =>
    dynamic(() => {
      const pair = Math.floor(i / 2);
      const angle = ((pair * 2 * Math.PI) / pairs + (i % 2) * 0.15) * spread.value;
      return dot(13, i % 2 ? 'green' : 'cyan').moveTo([
        origin[0] + radius * Math.cos(angle),
        origin[1] - radius * Math.sin(angle),
      ]);
    }),
  );
  const legend = place(
    row([label('Query', { color: 'cyan' }), label('Paired passage', { color: 'green' })], {
      gap: 'wide',
    }),
    key,
  );
  const collapsed = place(
    mono(`Partner share = 1/${pairs} = ${100 / pairs}%     ·     loss = ln ${pairs}`, {
      color: 'yellow',
    }),
    foot,
  );
  s.add(heading(c.title), legend, ring, points);
  c.on('cl-alignment-uniformity-align', () => s.play(indicate(points[0], { scale: 1.6 })));
  c.on('cl-alignment-uniformity-collapse', () => s.play(spread.to(0, { duration: 2.4 })));
  c.show('cl-alignment-uniformity-loss', collapsed, { after: true });
  c.on('cl-alignment-uniformity-spread', () => s.play(spread.to(1, { duration: 2.4 })));
  c.hide('cl-alignment-uniformity-spread', collapsed);
}
