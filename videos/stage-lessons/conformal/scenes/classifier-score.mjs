import { dynamic, group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CALIBRATION_CLASS_ZERO, correctedThreshold, labelScores } from '../parts.mjs';

export default function classifierScore(s, c) {
  const b = labelScores(s);
  const title = heading(c.title);
  const [head, table, foot] = area.rows([1, 5, 1], 'wide');
  const rows = table.rows(6, 'normal');
  const columns = table.columns([1.6, ...CALIBRATION_CLASS_ZERO.map(() => 1)], 'normal');
  const scores = CALIBRATION_CLASS_ZERO.map((p) => 1 - p);
  const sorted = scores
    .map((score, i) => ({ score, id: 'C' + (i + 1) }))
    .sort((a, b) => a.score - b.score);
  const selectedOn = s.value(0);
  const threshold = correctedThreshold(scores, 0.8);
  const calibration = group(
    place(label('nine held-out true labels · class 0', { color: 'cyan' }), head),
    ...['ID', 'p(true)', '1 − p', 'rank', 'sorted ID', 'sorted 1 − p'].map((name, r) =>
      note(name).moveTo([columns[0].cx, rows[r].cy]),
    ),
    ...CALIBRATION_CLASS_ZERO.flatMap((p, i) => [
      mono('C' + (i + 1), { size: 34, color: 'dim' }).moveTo([columns[i + 1].cx, rows[0].cy]),
      mono(p.toFixed(2), { size: 34, color: 'cyan' }).moveTo([columns[i + 1].cx, rows[1].cy]),
      mono(scores[i].toFixed(2), { size: 34 }).moveTo([columns[i + 1].cx, rows[2].cy]),
    ]),
    line(
      [table.left, (rows[2].bottom + rows[3].top) / 2],
      [table.right, (rows[2].bottom + rows[3].top) / 2],
      { stroke: 'faint', width: 2 },
    ),
    dynamic(() =>
      sorted.flatMap((record, i) => {
        const color = selectedOn.value > 0.5 && i + 1 === threshold.rank ? 'yellow' : 'dim';
        return [
          mono(String(i + 1), { size: 34, color }).moveTo([columns[i + 1].cx, rows[3].cy]),
          mono(record.id, { size: 34, color }).moveTo([columns[i + 1].cx, rows[4].cy]),
          mono(record.score.toFixed(2), { size: 34, color }).moveTo([
            columns[i + 1].cx,
            rows[5].cy,
          ]),
        ];
      }),
    ),
  );
  const selection = place(
    mono('rank 8 → q = ' + threshold.threshold.toFixed(1), { color: 'yellow' }),
    foot,
    'left',
  );
  const calibratedCutoff = place(mono('p ≥ 1 − q = 0.6', { color: 'yellow' }), foot, 'right');
  s.add(title, b.drawing);
  c.on('score', () => b.scoreOn.set(1));
  c.swapAll('calibration', calibration, { keep: [title] });
  c.show('cutoff', selection, { after: true });
  c.after('cutoff', () => selectedOn.set(1));
  c.show('probability-cutoff', calibratedCutoff, { after: true });
  c.swapAll('candidate', b.drawing, { keep: [title] });
  c.on('candidate', () => b.thresholdOn.set(1));
  c.after('confident', () => b.setOn.set(1));
  c.on('uniform', () => {
    b.setOn.set(0);
    s.play(b.uniform.to(1, { duration: 1 }));
  });
  c.after('empty', () => b.setOn.set(1));
}
