import { dot, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { number, ROUTER, router } from '../parts.mjs';

export default function crcLoss(s, c) {
  const b = router(s);
  b.criterionOn.set(0);
  const criterion = place(
    label('(n × mean loss + 1) / (n + 1)', { color: 'yellow' }),
    b.plot,
    'top',
  );
  const expected = place(note('expected loss over calibration + next request'), b.plot, 'top');
  const panels = b.stats.columns(3, 'wide');
  const wrong = ROUTER.filter((record) => record.wrong);
  const curves = dynamic(() =>
    wrong.flatMap((record, i) => {
      const region = panels[i];
      const x = (value) => region.left + 70 + value * (region.width - 100);
      const high = region.top + 74;
      const low = region.bottom - 54;
      const loss = record.score > b.gate.value + 1e-9 ? 1 : 0;
      return [
        place(
          mono(record.id + ' · score ' + number(record.score, 1) + ' · loss ' + loss, {
            size: 34,
            color: loss ? 'red' : 'green',
          }),
          region,
          'top',
        ),
        mono('1', { size: 34, color: 'dim' }).moveTo([region.left + 20, high]),
        mono('0', { size: 34, color: 'dim' }).moveTo([region.left + 20, low]),
        line([x(0), high], [x(record.score), high], { stroke: 'red', width: 4 }),
        line([x(record.score), low], [x(1), low], { stroke: 'green', width: 4 }),
        dot(10, 'red').moveTo([x(record.score), high]),
        dot(7, 'bg').moveTo([x(record.score), high]),
        dot(10, 'green').moveTo([x(record.score), low]),
        line([x(b.gate.value), high - 12], [x(b.gate.value), low + 12], {
          stroke: 'yellow',
          width: 3,
        }),
        dot(7, 'yellow').moveTo([x(b.gate.value), loss ? high : low]),
        mono('λ: 0', { size: 34, color: 'dim' }).moveTo([x(0), region.bottom - 12]),
        mono('1', { size: 34, color: 'dim' }).moveTo([x(1), region.bottom - 12]),
      ];
    }),
  );
  s.add(heading(c.title), b.frame, b.drawing, b.threshold, b.readout);
  c.after('denominators', () => b.resultOn.set(1));
  c.on('stricter', () => {
    b.names.set(0);
    s.play(b.gate.to(0.1, { duration: 1.5 }));
    b.names.set(1);
  });
  c.swap('curves', b.readout, curves);
  c.on('curves', () => b.gate.set(0));
  c.on('non-increasing', () => {
    b.names.set(0);
    s.play(b.gate.to(wrong[1].score, { duration: 2 }));
    b.names.set(1);
  });
  c.on('right-continuous', () => {
    b.names.set(0);
    s.play(b.gate.to(wrong[2].score, { duration: 0.6 }));
    b.names.set(1);
  });
  c.show('criterion', criterion);
  c.swap('expected', criterion, expected);
  c.swap('expected', curves, b.readout);
  c.on('expected', () => {
    b.gate.set(0.1);
  });
  c.keep([b.frame, b.drawing, b.threshold, b.readout]);
}
