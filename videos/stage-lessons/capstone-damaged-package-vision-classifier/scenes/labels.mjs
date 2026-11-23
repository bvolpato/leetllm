import { indicate, place, rect, table } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { cast, parcel, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('The seam is visible. The contents stay hidden.'));
  const [image, foot] = work.rows([5, 2], 'wide');
  const [visible, hidden] = image.columns([3, 2], 'loose');
  const p = parcel(visible);
  const contents = place(
    rect(hidden.width, hidden.height, { fill: 'surface', stroke: 'dim', width: 3, dash: [10, 8] }),
    hidden,
  );
  const question = place(label('Contents?', { color: 'dim' }), hidden);
  const seam = place(label('Torn seam', { color: 'pink' }), visible.inset('normal'), 'bottom');
  const guide = place(
    table(
      ['id', 'Label'],
      [
        { id: 'Visible defect', Label: 'Damaged' },
        { id: 'Ambiguous', Label: 'Unknown' },
        { id: 'Unusable', Label: 'Unknown' },
      ],
      { size: 34, leading: 1.5, width: foot.width },
    ),
    foot,
  );
  s.add(p, contents, question, guide);
  c.on('visible', () => s.play(indicate(p, { scale: 1, color: 'cyan' })));
  c.show('seam', seam);
  c.on('hidden', () => s.play(indicate(contents, { scale: 1, color: 'dim' })));
  c.on('queue', () => s.play(guide.light('Visible defect')));
  c.on('uncertain', () => s.play(guide.light('Ambiguous')));
}
