import { boxOf, column, place, rect, row, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';

export default function taskFormat(s, c) {
  const [top, inputs, model, foot] = area.rows([1, 4, 2, 1], 'normal');
  const title = place(label('query and passage follow one checkpoint contract'), top);
  const regions = inputs.rows(2, 'wide');
  const query = label('How do I rotate an API key?', { color: 'cyan' });
  const passage = label('Create a replacement key, then revoke the old key.', {
    color: 'blue',
    size: 34,
  });
  const prefixWidth = 340,
    fieldHeight = 94;
  const qPrefix = namedBox('query:', { width: prefixWidth, height: fieldHeight, color: 'cyan' });
  const pPrefix = namedBox('passage:', { width: prefixWidth, height: fieldHeight, color: 'blue' });
  place(row([qPrefix, query], { gap: 'normal' }), regions[0]);
  place(row([pPrefix, passage], { gap: 'normal' }), regions[1]);
  const destinations = [query.center, passage.center];
  const prefixes = [qPrefix.center, pPrefix.center];
  const queryInstruction = namedBox('instruction', {
    width: prefixWidth,
    height: fieldHeight,
    color: 'cyan',
  }).moveTo(prefixes[0]);
  const passageInstruction = namedBox('instruction', {
    width: prefixWidth,
    height: fieldHeight,
    color: 'blue',
  }).moveTo(prefixes[1]);
  const starts = regions.map((r) => r.point('center'));
  query.moveTo(starts[0]);
  passage.moveTo(starts[1]);
  qPrefix.moveTo([regions[0].left + prefixWidth / 2, prefixes[0][1]]);
  pPrefix.moveTo([regions[1].left + prefixWidth / 2, prefixes[1][1]]);
  const frames = regions.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', fill: null, width: 2 }), r),
  );
  const e5 = place(mono('E5-base-v2'), model);
  const bge = place(
    column([mono('BGE v1.5'), note('instructed short query · plain passage')], {
      gap: 'normal',
      align: 'center',
    }),
    model,
  );
  const instructor = place(
    column([mono('INSTRUCTOR'), note('[instruction, text]')], { gap: 'normal', align: 'center' }),
    model,
  );
  const scope = place(note('Inputs to the encoder'), foot);
  const binding = place(
    note('checkpoint · tokenizer · pooling · normalization · corpus · index score'),
    foot,
  );
  s.add(heading(c.title), title, frames, query, passage, e5, scope);
  c.show('cl-task-format-e5', [qPrefix, pPrefix]);
  c.on(
    'cl-task-format-e5',
    () =>
      s.play(
        to(qPrefix, (n) => n.moveTo(prefixes[0]), { duration: 1.2 }),
        to(pPrefix, (n) => n.moveTo(prefixes[1]), { duration: 1.2 }),
        to(query, (n) => n.moveTo(destinations[0]), { duration: 1.2 }),
        to(passage, (n) => n.moveTo(destinations[1]), { duration: 1.2 }),
      ),
    0.5,
  );
  c.swap('cl-task-format-bge', [e5, qPrefix, pPrefix], [bge, queryInstruction]);
  c.on(
    'cl-task-format-bge',
    () => s.play(to(passage, (n) => n.moveTo(starts[1]), { duration: 1.2 })),
    0.5,
  );
  c.swap('cl-task-format-instructor', bge, instructor);
  c.show('cl-task-format-instructor', passageInstruction, { lead: -1.9 });
  c.on(
    'cl-task-format-instructor',
    () => s.play(to(passage, (n) => n.moveTo(destinations[1]), { duration: 1.2 })),
    0.5,
  );
  c.swap('cl-task-format-bind', scope, binding);
}
