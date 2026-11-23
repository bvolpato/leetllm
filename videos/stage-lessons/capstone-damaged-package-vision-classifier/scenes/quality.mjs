import { column, place, table } from 'vizmatic/stage';
import { area, heading, label } from '../../kit-narrated.mjs';
import { visionRoute } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { ACTION } from '../parts.mjs';
import { caption, photograph, recordedView } from '../inspection.mjs';

export default function scene(s, c) {
  const dark = recordedView('R-406-a'),
    empty = recordedView('R-409-a');
  const changed = visionRoute(dark.photo, { ...dark.output, brightness: 0.3 });
  const [body, verdict] = area.rows([8, 1], 'wide');
  const [left, right] = body.columns([1, 1], 'loose');
  const [id, frame, human] = left.rows([1, 5, 1], 'normal');
  const [rules, rows, action] = right.rows([2, 4, 1], 'normal');
  const numbers = (trace) => [
    { id: 'Parcel visible', value: trace.box_visible ? 'Yes' : 'No' },
    { id: 'Blur', value: trace.blur_score.toFixed(2) },
    { id: 'Brightness', value: trace.brightness.toFixed(2) },
    { id: 'Damage score', value: trace.damage_probability.toFixed(2) },
  ];
  const reading = (trace) =>
    place(
      table(
        [
          { key: 'id', label: 'Measurement' },
          { key: 'value', label: 'Supplied value' },
        ],
        numbers(trace),
        { size: 38, width: rows.width },
      ),
      rows,
    );
  const values = reading(dark.trace);
  const emptyValues = reading(empty.trace);
  const name = caption(id, dark.photo.photo_id),
    emptyName = caption(id, empty.photo.photo_id);
  const darkPhoto = photograph(frame, 'dark'),
    emptyPhoto = photograph(frame, 'empty');
  const original = caption(action, ACTION[dark.trace.action] + ' requested', 'cyan');
  const changedRoute = caption(action, ACTION[changed.action] + ' review', 'yellow');
  const emptyRoute = caption(action, ACTION[empty.trace.action] + ' requested', 'cyan');
  const quality = caption(human, 'Human label   ·   unusable', 'pink', 36);
  const ask = caption(
    verdict,
    'With reported brightness 0.30, which route does R-406-a get?',
    'ink',
  );
  const failure = caption(verdict, 'Unusable photo sent to priority review', 'pink');
  const reason = caption(verdict, 'Include the parcel', 'cyan');
  s.add(
    heading(c.title),
    name,
    darkPhoto,
    values,
    place(
      column(
        [
          label('Brightness ≥ 0.20    Blur ≤ 0.45', { size: 38 }),
          label('Parcel visible    Priority score ≥ 0.70', { size: 38 }),
        ],
        { gap: 'normal' },
      ),
      rules,
    ),
  );
  c.show('retake', original, { after: true });
  c.show('human', quality);
  c.on('change', () =>
    s.play(values.setCell('Brightness', 'value', changed.brightness.toFixed(2), { duration: 0.3 })),
  );
  c.hide('change', original);
  c.show('change', ask);
  c.hide('wrong', ask);
  c.show('wrong', changedRoute, { after: true });
  c.show('mismatch', failure, { after: true });
  c.swap('empty', [name, darkPhoto, values], [emptyName, emptyPhoto, emptyValues]);
  c.hide('empty', [changedRoute, failure, quality]);
  c.show('presence', [emptyRoute, reason], { after: true });
}
