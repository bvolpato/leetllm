import { assertEqual, dynamic, place, rect, to } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { cast, parcel, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('A small cue must survive the input transform'));
  const inputWidth = 1024,
    outputWidth = 224,
    featureWidth = 4;
  const survivingWidth = (featureWidth * outputWidth) / inputWidth;
  assertEqual(survivingWidth, 0.875, 'retained feature width');
  const [image, measure, foot] = work.rows([3, 3, 1], 'wide');
  const [left, right] = image.columns(2, 'loose');
  const p = parcel(left, { dark: true });
  const region = place(
    rect(right.width, right.height, { fill: 'surface', stroke: 'cyan', width: 3 }),
    right,
  );
  const bright = place(
    rect(right.width * 0.12, right.height * 0.25, { fill: 'ink', stroke: null }),
    right,
    'right',
  );
  const whole = place(
    label('Parcel region', { color: 'cyan', size: 34 }),
    right.inset('normal'),
    'bottom',
  );
  const scale = s.value(1);
  const frame = dynamic(() =>
    place(
      rect(measure.width * scale.value, measure.height * 0.65, {
        stroke: 'blue',
        fill: 'surface',
        width: 3,
      }),
      measure,
    ),
  );
  const detail = dynamic(() =>
    place(
      rect(
        Math.max(3, ((measure.width * featureWidth) / inputWidth) * scale.value),
        measure.height * 0.5,
        { stroke: 'pink', fill: 'pink', width: 3 },
      ),
      measure,
    ),
  );
  const result = place(
    label('4 px × 224 / 1024 = ' + survivingWidth.toFixed(3) + ' px', { color: 'yellow' }),
    foot,
  );
  const compare = place(
    label('Whole frame · parcel crop · higher resolution', { color: 'yellow', size: 34 }),
    foot,
  );
  s.add(p, region, bright, frame, detail);
  c.show('region', whole);
  c.on('resize', () => s.play(scale.to(outputWidth / inputWidth, { duration: 2.2 })));
  c.show('detail', result, { after: true });
  c.swap('compare', result, compare);
}
