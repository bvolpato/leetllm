import { dynamic, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { RESIDUALS, SCALES, correctedThreshold, testIntervals } from '../parts.mjs';

export default function normalizedScore(s, c) {
  const title = heading(c.title);
  const scores = RESIDUALS.map((v, i) => v / SCALES[i]);
  const cut = correctedThreshold(scores, 0.8);
  const order = scores
    .map((score, id) => ({ score, id }))
    .sort((a, b) => a.score - b.score || a.id - b.id);
  const [focus, rack, footer] = area.inset('normal').rows([2, 2, 1], 'wide');
  const slots = rack.columns(scores.length, 'tight');
  const step = s.value(0);
  const calibration = dynamic(() => {
    const worked = step.value >= 1;
    const sorted = step.value >= 2;
    const marked = step.value >= 3;
    return [
      place(label('Request C8 · error 8 ms · frozen scale 4 ms', { size: 45 }), focus, 'top'),
      place(
        mono(worked ? '8 ms / 4 ms = 2' : '8 ms / 4 ms = ?', { size: 65, color: 'yellow' }),
        focus,
        'bottom',
      ),
      ...slots.flatMap((slot, pos) => {
        const id = sorted ? order[pos].id : pos;
        const color = marked && pos === cut.index ? 'yellow' : 'cyan';
        return [
          note('C' + (id + 1), { size: 33, color }).moveTo([slot.cx, rack.cy - 70]),
          mono(RESIDUALS[id] + '/' + SCALES[id], { size: 39 }).moveTo([slot.cx, rack.cy - 9]),
          ...(worked
            ? [
                mono(Number(scores[id].toFixed(2)).toString(), { size: 37, color }).moveTo([
                  slot.cx,
                  rack.cy + 50,
                ]),
              ]
            : []),
          ...(marked && pos === cut.index
            ? [
                line([slot.cx - 43, rack.cy + 83], [slot.cx + 43, rack.cy + 83], {
                  stroke: 'yellow',
                  width: 5,
                }),
              ]
            : []),
        ];
      }),
      place(
        note(
          marked
            ? 'Rank 8 · normalized threshold q = ' + cut.threshold
            : sorted
              ? 'Sorted by normalized score'
              : 'Absolute error / scale · scores rounded to two decimals',
        ),
        footer,
      ),
    ];
  });
  const b = testIntervals(s, { compareScales: true });
  const original = place(label('Original fixed intervals', { color: 'yellow' }), b.head, 'left');
  const applied = place(label('Radius = 2 × scale', { color: 'yellow' }), b.head, 'left');
  s.add(title, calibration);
  c.after('divide', () => step.set(1));
  c.on('sort', () => step.set(2));
  c.after('threshold', () => step.set(3));
  c.swapAll('return', [b.frame, b.drawing, original], { keep: [title] });
  c.on('return', () => b.tally.set(1));
  c.swap('scales', original, applied);
  c.on('scales', () => b.scalesOn.set(1));
  c.after('first', () => s.play(b.adapted[0].to(1, { duration: 0.8 })));
  c.on('middle', () =>
    s.play(b.adapted[1].to(1, { duration: 0.8 }), b.adapted[2].to(1, { duration: 0.8 })),
  );
  const question = place(note('T4 upper endpoint? Does 55 fit?'), b.head, 'right');
  c.on('question', () => b.tally.set(0));
  c.show('question', question);
  c.hide('fourth', question);
  c.after('fourth', () => {
    s.play(b.adapted[3].to(1, { duration: 1.2 }));
    b.tally.set(1);
  });
}
