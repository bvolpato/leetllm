import { column, group, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { caption, recordedView } from '../inspection.mjs';
import { ACTION } from '../parts.mjs';
import { visionOutcomes } from '../../../films/capstone-damaged-package-vision-classifier/fixtures.mjs';

export default function scene(s, c) {
  const { photo, trace } = recordedView('R-408-a');
  const outcome = visionOutcomes.find((row) => row.case_id === photo.case_id);
  const [headers, bodies, question, foot] = area.rows([1, 5, 1, 1], 'normal');
  const [left, right] = bodies.columns(2, 'loose');
  const [lh, rh] = headers.columns(2, 'loose');
  const [upper, lower] = left.rows([3, 1], 'normal');
  const [document, signature] = right.rows([3, 1], 'normal');
  const result = caption(foot, 'Normal review + confirmed damage = one missed case', 'pink', 42);
  const tag = group(
    place(
      rect(lower.width * 0.88, lower.height, { fill: 'surface', stroke: 'pink', width: 3 }),
      signature,
    ),
    place(
      label(photo.case_id + '   ·   Confirmed damaged', { color: 'pink', size: 38 }),
      signature,
    ),
  );
  s.add(
    heading(c.title),
    caption(lh, 'Served on day ' + trace.routed_day),
    caption(rh, 'Specialist record'),
    place(
      column(
        [
          mono('Case ' + photo.case_id, { size: 48, color: 'cyan' }),
          label(trace.photo_id + '   ·   Quality passed', { size: 39 }),
          mono(
            'Score ' +
              trace.damage_probability.toFixed(2) +
              ' < ' +
              trace.damage_threshold.toFixed(2),
            { size: 39 },
          ),
          label(ACTION[trace.action] + ' review', { size: 47, color: 'yellow' }),
        ],
        { gap: 'normal' },
      ),
      upper,
    ),
  );
  c.show('label', tag);
  const dated = place(
    column(
      [
        mono('Case ' + outcome.case_id, { color: 'cyan', size: 48 }),
        label('Reviewed on day ' + outcome.reviewed_day, { size: 39 }),
        label('Available on day ' + outcome.available_day, { size: 39 }),
        mono(outcome.guideline_version, { color: 'dim', size: 36 }),
      ],
      { gap: 'normal' },
    ),
    document,
  );
  c.show('date', dated);
  c.on('join', () => s.play(to(tag, (n) => place(n, lower), { duration: 1.0 })));
  c.show('join', caption(question, 'Match the physical case ID on the two records.', 'dim', 36));
  c.show('miss', result, { after: true });
}
