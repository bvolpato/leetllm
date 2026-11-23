import { dot, dynamic, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { exchangeabilityState } from '../parts.mjs';

export default function exchangeability(s, c) {
  const cases = exchangeabilityState(2, 1).cases;
  const [calibration, middle, tally] = area.rows([3, 3, 1], 'loose');
  const slots = calibration.columns(10, 'tight');
  const [future, result] = middle.columns([1, 2], 'loose');
  const [qPlace, verdictPlace] = result.rows(2, 'normal');
  const step = s.value(-1),
    names = s.value(1),
    earned = s.value(0),
    verdict = s.value(0);
  const frame = group(
    ...slots
      .map((slot, i) => [
        rect(slot.width * 0.85, calibration.height * 0.5, {
          stroke: 'dim',
          fill: null,
          radius: 9,
        }).moveTo([slot.cx, calibration.cy]),
        mono(String(i + 1), { size: 34, color: 'dim' }).moveTo([slot.cx, calibration.bottom]),
      ])
      .flat(),
    place(note('calibration positions'), calibration, 'top left'),
    place(note('held-out future'), future, 'bottom'),
    rect(future.width * 0.8, future.height * 0.65, {
      stroke: 'dim',
      fill: null,
      radius: 12,
    }).moveTo(future.point('center')),
    ...tally
      .columns(10, 'tight')
      .map((slot, i) => place(mono(String(i + 1), { color: 'dim', size: 34 }), slot)),
  );
  const position = (identity, held) => {
    if (held < 0) return slots[identity].point('center');
    return identity === held
      ? future.point('center')
      : slots[identity < held ? identity : identity - 1].point('center');
  };
  const drawing = dynamic(() => {
    const a = Math.floor(step.value),
      b = Math.ceil(step.value),
      amount = step.value - a;
    return slots.flatMap((_, i) => {
      const p = position(i, a),
        q = position(i, b);
      const point = p.map((v, j) => v + (q[j] - v) * amount);
      const color = i === Math.round(step.value) ? 'yellow' : 'cyan';
      return [
        dot(23, color).moveTo(point),
        mono(String(i + 1), { size: 36, color })
          .moveTo([point[0], point[1] - 54])
          .opacity(names.value),
      ];
    });
  });
  const values = dynamic(() => {
    const i = Math.round(step.value);
    if (i < 0) return [];
    if (!names.value) return [];
    const trial = cases[i];
    const slot = slots[7];
    const focus = rect(slot.width * 0.86, calibration.height * 0.51, {
      fill: null,
      stroke: 'yellow',
      width: 4,
      radius: 9,
    }).moveTo(slot.point('center'));
    if (!verdict.value)
      return [
        focus,
        place(label('Score at calibration rank 8?', { size: 42 }), qPlace),
        place(note('Does it cover ' + trial.future + '?'), verdictPlace),
      ];
    return [
      focus,
      place(mono('q = ' + trial.threshold, { size: 44, color: 'yellow' }), qPlace),
      place(
        label(trial.future + (trial.covered ? ' ≤ ' : ' > ') + trial.threshold, {
          color: trial.covered ? 'green' : 'red',
        }),
        verdictPlace,
      ).opacity(names.value),
    ];
  });
  const counted = dynamic(() =>
    tally
      .columns(10, 'tight')
      .flatMap((slot, i) =>
        i < earned.value
          ? [dot(14, cases[i].covered ? 'green' : 'red').moveTo([slot.cx, slot.top])]
          : [],
      ),
  );
  const total = place(label('8 / 10 = 80%', { color: 'yellow' }), verdictPlace);
  s.add(heading(c.title), frame, drawing, values, counted);
  function holdOut(i) {
    names.set(0);
    verdict.set(0);
    s.play(step.to(i, { duration: 0.64 }));
    names.set(1);
  }
  function count(i) {
    verdict.set(1);
    earned.set(i + 1);
  }
  c.on('enumerate', () => {
    for (let i = 0; i < 7; i++) {
      holdOut(i);
      count(i);
      s.wait(0.5);
    }
  });
  c.on('eight', () => holdOut(7));
  c.after('inside', () => count(7));
  c.on('nine', () => holdOut(8));
  c.after('outside', () => count(8));
  c.on('ten', () => holdOut(9));
  c.after('last', () => count(9));
  c.hide('total', values);
  c.show('total', total, { after: true });
}
