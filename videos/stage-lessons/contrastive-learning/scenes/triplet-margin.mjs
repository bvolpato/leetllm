import { assertEqual, dynamic, indicate, numberLine, place } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
export default function tripletMargin(s, c) {
  const [top, positiveRegion, negativeRegion, foot] = area.rows([1, 3, 3, 1], 'normal');
  const margin = 0.1,
    good = [0.2, 0.5],
    bad = [0.5, 0.3];
  const gap = s.value(good[0] - good[1] + margin);
  const formula = place(
    label('max(0, positive distance − negative distance + margin)', { size: 34 }),
    top,
  );
  const make = (region, name, value, color, extra = []) =>
    place(
      numberLine({
        range: [0, 0.7],
        step: 0.1,
        length: region.width - 160,
        width: 3,
        size: 34,
        labelSize: 34,
        format: (v) => v.toFixed(1),
        points: [{ name, value, color }, ...extra],
      }),
      region,
    );
  const positive = make(positiveRegion, 'positive', good[0], 'green', [
    { name: 'margin edge', value: good[0] + margin, color: 'yellow', label: false },
  ]);
  const negative = make(negativeRegion, 'negative', good[1], 'pink');
  const bracket = positive.bracket('positive', 'margin edge', { label: 'margin 0.1', size: 34 });
  const slot = place(mono('loss = 0.000', { color: 'yellow' }), foot);
  const result = mono('loss = 0.000', { color: 'yellow' }).moveTo(slot.center);
  const activeResult = mono('loss = ' + (bad[0] - bad[1] + margin).toFixed(3), {
    color: 'yellow',
  }).moveTo(slot.center);
  assertEqual(Math.abs(bad[0] - bad[1] + margin - 0.3) < 1e-12, true, 'active triplet');
  s.add(heading(c.title), formula, positive, negative, bracket);
  c.on('cl-triplet-margin-rule', () => s.play(indicate(positive, { scale: 1 })));
  c.show('cl-triplet-margin-zero', result, { after: true });
  c.hide('repair-triplet-inputs', result, { lead: -0.8, fade: 0.2 });
  c.on(
    'repair-triplet-inputs',
    () =>
      s.play(
        positive.move({ positive: bad[0], 'margin edge': bad[0] + margin }, { duration: 1 }),
        negative.move({ negative: bad[1] }, { duration: 1 }),
        gap.to(bad[0] - bad[1] + margin, { duration: 1 }),
      ),
    1.1,
  );
  c.show('cl-triplet-margin-active', activeResult, { after: true });
  c.on('cl-triplet-margin-contract', () => s.play(indicate(negative, { scale: 1 })));
}
