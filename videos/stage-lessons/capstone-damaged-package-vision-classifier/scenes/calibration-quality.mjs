import { axes, dot, dynamic, indicate, line, place, polyline, row } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { cast, work } from '../parts.mjs';
import { visionSigmoid } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('How often do high scores correspond to damage?'));
  const [top, body, foot] = work.rows([1, 5, 1], 'wide');
  const temperature = s.value(1),
    logit = 2;
  const plot = place(
    axes({
      x: [0, 4],
      y: [0, 1],
      width: body.width * 0.8,
      height: body.height * 0.72,
      xStep: 2,
      yStep: 0.5,
      labelSize: 34,
      tips: false,
    }),
    body,
  );
  const curve = dynamic(() =>
    polyline(
      Array.from({ length: 81 }, (_, i) => {
        const x = i / 20;
        return plot.world(x, visionSigmoid(x / temperature.value));
      }),
      { stroke: 'blue', width: 4 },
    ),
  );
  const point = dynamic(() =>
    dot(20, 'yellow').moveTo(plot.world(logit, visionSigmoid(logit / temperature.value))),
  );
  const headingText = place(
    label('Horizontal: logit     Vertical: probability', { color: 'dim', size: 36 }),
    top,
  );
  const reading = (t) =>
    place(
      row(
        [mono('T = ' + t), mono('p = ' + visionSigmoid(logit / t).toFixed(4), { color: 'yellow' })],
        {
          gap: 'loose',
        },
      ),
      foot,
    );
  const quality = place(
    label('Measure quality rejections and recovered damage.', { color: 'yellow', size: 34 }),
    foot,
  );
  const check = place(label('Usable photos with scores near 0.80', { size: 48 }), top);
  const frequency = place(
    label('If calibrated, about 8 in 10 have damage.', { color: 'yellow', size: 46 }),
    body,
  );
  s.add(check, frequency);
  c.on('dark', () => s.play(indicate(photoCast.pictures[0], { scale: 1, color: 'red' })));
  c.swap(1, [check, frequency], [plot, curve, point, headingText]);
  const first = reading(1),
    second = reading(2);
  c.show('initial', first);
  c.hide('change', first);
  c.on('change', () => s.play(temperature.to(2, { duration: 1.05 })));
  c.show('temperature', second, { after: true });
  const cutoff = line(plot.world(0, 0.8), plot.world(4, 0.8), {
    stroke: 'cyan',
    width: 3,
    dash: [12, 8],
  });
  const firstPoint = dot(11, 'dim').moveTo(plot.world(logit, visionSigmoid(logit)));
  c.show('cutoff', [cutoff, firstPoint]);
  c.swap('workflow', second, quality);
}
