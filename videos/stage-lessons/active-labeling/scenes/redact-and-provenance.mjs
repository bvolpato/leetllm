import { boxOf, column, dot, grid, group, indicate, place, rect, row, to } from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { rawText, provenance } from '../../../films/active-labeling/fixtures.mjs';
import { redact } from '../../../films/active-labeling/model.mjs';
import { footer, open, picture, traceRecord } from '../parts.mjs';
export default function redactAndProvenance(s, c) {
  open(s, c);
  const [left, right] = picture.columns([6, 3], 'loose');
  const trace = traceRecord(left);
  const [nextTrace, shelf] = right.rows([3, 2], 'loose');
  const nextFrame = place(
    rect(nextTrace.width - 8, nextTrace.height - 8, { stroke: 'dim', width: 3, radius: 12 }),
    nextTrace,
  ).zIndex(-1);
  const context = place(note('Next trace'), nextTrace.inset('normal'), 'top');
  const tags = place(
    row(
      Object.entries(provenance)
        .filter(([key]) => key !== 'trace')
        .map(([, value]) => chip(value, { color: 'dim' })),
      { gap: 'tight' },
    ),
    trace.slots[5],
  );
  const mappings = ['sender', 'reply-to', 'cc'].map((field, i) =>
    place(
      column(
        [
          note(field),
          row(
            [
              mono(i < 2 ? 'alex@example.org' : 'sam@example.org', { size: 31 }),
              label('→'),
              mono(i < 2 ? '[EMAIL_1]' : '[EMAIL_2]', { size: 31, color: 'cyan' }),
            ],
            { gap: 'normal' },
          ),
        ],
        { gap: 'tight' },
      ),
      trace.slots[i + 1],
      'left',
    ),
  );
  const reset = place(
    column(
      [
        chip('trace-next', { color: 'dim' }),
        mono('sam@example.org', { size: 29 }),
        mono('[EMAIL_1]', { size: 34, color: 'cyan' }),
        note('Numbering restarts'),
      ],
      { gap: 'tight' },
    ),
    nextTrace.inset('normal').rows([1, 5], 'tight')[1],
  );
  const shelfFrame = place(
    rect(shelf.width - 8, shelf.height - 8, { stroke: 'dim', width: 4, radius: 10 }),
    shelf,
  ).zIndex(-1);
  const restricted = place(
    note('Restricted identity mapping', { color: 'red' }),
    shelf.inset('normal'),
    'bottom',
  );
  const copy = place(mono(rawText, { size: 29, color: 'ink' }), shelf);
  const target = boxOf(copy).point('center');
  const identity = dot(13, 'ink').moveTo(boxOf(trace.email).point('center'));
  const clean = place(mono(redact(rawText), { size: 31, color: 'cyan' }), trace.slots[4], 'left');
  const mask = place(
    rect(boxOf(trace.email).width, boxOf(trace.email).height, { fill: 'surface' }),
    boxOf(trace.email),
  );
  const scope = place(
    note('Numbered placeholders · stable within trace-204'),
    trace.slots[4],
    'left',
  );
  const limit = place(
    note('Patterns can miss identifying descriptions. Review purpose and permission.', {
      color: 'red',
    }),
    footer,
  );
  s.add(
    trace.nodes.filter((n) => n !== trace.family),
    context,
    nextFrame,
    shelfFrame,
    restricted,
  );
  c.on('raw-permission', () => s.play(indicate(trace.id, { color: 'yellow', scale: 1 })));
  c.hide('redact-copy', trace.email);
  c.show('redact-copy', [identity, mask]);
  c.on('redact-copy', () => s.play(to(identity, (n) => n.moveTo(target), { duration: 1.5 })), 0.4);
  c.hide('redact-copy', [mask, identity], { after: true });
  c.show('redact-copy', copy, { after: true, lead: -0.35 });
  c.show('redact-copy', clean, { after: true, lead: -0.35 });
  c.show('retain-lineage', tags);
  c.swap('placeholder-scope', [trace.prompt, trace.a, trace.b, clean], [mappings, scope]);
  c.show('reset-placeholders', reset);
  c.show('redaction-limit', limit);
}
