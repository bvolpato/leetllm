import { axes, beside, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, open } from '../parts.mjs';
import { rankingFeatures } from '../../../films/capstone-product-ranking-recommendation/fixtures.mjs';
import { rankingResponse } from '../../../films/capstone-product-ranking-recommendation/model.mjs';

export default function pairwise(s, c) {
  const [plot, sidebar] = open(s, c).columns([1, 1], 'wide');
  const [caption, plane, xlabel] = plot.rows([1, 7, 1], 'normal');
  const a = place(
    axes({
      x: [0, 1.2],
      y: [0, 1.2],
      width: 520,
      height: 440,
      xStep: 0.5,
      yStep: 0.5,
      labelSize: 28,
      tips: false,
    }),
    plane,
  );
  const ids = ['P4', 'P5'];
  const rows = sidebar.rows(5, 'wide');
  const progress = s.value(0);
  const frames = Array.from({ length: 13 }, (_, i) => rankingResponse(i));
  const current = () => frames[Math.round(progress.value)];
  const direction = dynamic(() => {
    const w = current().weights,
      norm = Math.hypot(...w),
      unit = w.map((x) => x / norm);
    const projections = ids.map((id) => {
      const [match, quality] = rankingFeatures[id];
      return match * unit[0] + quality * unit[1];
    });
    const onDirection = (distance) => a.world(unit[0] * distance, unit[1] * distance);
    const origin = a.world(0, 0),
      tip = onDirection(Math.max(1, ...projections));
    return [
      line(origin, tip, { stroke: 'yellow', width: 6 }),
      dot(9, 'yellow').moveTo(tip),
      ...ids.map((id, i) =>
        line(a.world(...rankingFeatures[id]), onDirection(projections[i]), {
          stroke: COLOR[id],
          width: 3,
          dash: [9, 7],
        }),
      ),
    ];
  });
  s.add(
    a,
    place(note('Listing quality'), caption),
    place(note('Semantic match'), xlabel),
    ...ids.map((id) => {
      const point = dot(12, COLOR[id]).moveTo(a.world(...rankingFeatures[id]));
      return [
        point,
        beside(mono(id, { color: COLOR[id] }), point, 'right', 'normal'),
      ];
    }),
    place(label('Rank scores'), rows[0]),
  );
  c.show('pairwise-b1-1', direction);
  c.show(
    'pairwise-b1-2',
    dynamic(() =>
      ids.flatMap((id, i) => {
        const r = rows[i + 1],
          score = current().slate.find((entry) => entry.id === id).score,
          width = 330 * score;
        return [
          mono(id, { color: COLOR[id] }).moveTo([r.left + 50, r.cy]),
          rect(width, 26, { fill: COLOR[id], stroke: null }).moveTo([
            r.left + 125 + width / 2,
            r.cy,
          ]),
          mono(score.toFixed(3)).moveTo([r.right - 85, r.cy]),
        ];
      }),
    ),
  );
  c.show(
    'pairwise-b2-1',
    dynamic(() =>
      place(note('Preference updates   ' + Math.round(progress.value) + ' / 12'), rows[3]),
    ),
  );
  const question = place(label('Which printer should move ahead?', { size: 37, color: 'yellow' }), rows[4]);
  c.show('pairwise-question', question);
  c.on('pairwise-b2-2', () => s.play(progress.to(12, { duration: 2.5 })));
  c.swap(
    'pairwise-b2-3', question,
    place(label('P5 leads on the new direction', { color: 'green' }), rows[4]), { after: true },
  );
}
