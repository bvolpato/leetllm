import {
  boxOf,
  circle,
  column,
  dynamic,
  group,
  line,
  linear,
  par,
  place,
  recolor,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function intro(s, c) {
  const [search, document, footer] = area.rows([1.15, 3.7, 0.65], 'wide');
  const bar = place(
    rect(search.width, search.height, {
      radius: 50,
      fill: 'surface',
      stroke: 'cyan',
      width: 5,
    }),
    search,
  );
  const [tool, field] = search.inset(16).columns([1, 12], 'normal');
  const glass = place(
    group(
      circle(27, { stroke: 'cyan', width: 8 }),
      line([20, 20], [43, 43], { stroke: 'cyan', width: 9 }),
    ),
    tool,
  );
  const terms = ['refresh', 'expired', 'machine', 'credential'].map((word) =>
    label(word, { size: 76 }),
  );
  place(row(terms, { gap: 'wide' }), field, 'left');
  const typed = place(mono('KROT-14', { size: 72, color: 'cyan' }), field, 'left');

  const paper = place(
    rect(document.width, document.height, {
      fill: 'surface',
      stroke: 'grid',
      width: 3,
      radius: 10,
    }),
    document,
  );
  const sheet = boxOf(paper).inset(54);
  const [header, subject, rule] = sheet.rows([0.85, 1.35, 1.6], 'normal');
  const folio = place(note('EU support   /   Key rotation policy', { size: 39 }), header, 'left');
  const printed = place(mono('KROT-14', { size: 53 }), header, 'right');
  const stale = label('Stale', { size: 87 });
  const keys = label('service-account keys', { size: 87 });
  place(row([stale, keys], { gap: 22 }), subject, 'left');
  const clauses = place(
    column(
      [
        label('Automated rotation up to 14 days after becoming stale', { size: 48 }),
        label('Risk signal at most 48 hours old', { size: 48 }),
      ],
      { align: 'left', gap: 'tight' },
    ),
    rule,
    'left',
  );

  const fields = terms.map((term) => boxOf(term));
  const x = s.value(fields[0].left + fields[0].width * 0.25);
  const width = s.value(fields[0].width * 0.5);
  const cursor = dynamic(() =>
    rect(width.value + 34, fields[0].height + 14, {
      fill: 'gridStrong',
      radius: 12,
    })
      .stroke(null)
      .moveTo([x.value, fields[0].cy]),
  );
  const missing = place(label('Matching search words   0', { size: 47, color: 'yellow' }), footer);
  const match = place(
    label('Matching search term   KROT-14', { size: 47, color: 'green' }),
    footer,
  );
  const underCode = [typed, printed].map((node) => {
    const b = boxOf(node);
    return line([b.left, b.bottom + 13], [b.right, b.bottom + 13], { stroke: 'green', width: 7 });
  });
  const page = group(paper, folio, printed, stale, keys, ...clauses.nodes);
  const ask = heading(c.title);
  const shell = group(bar, glass, page);
  const words = group(...terms);
  const opening = [ask, shell, cursor, words];
  s.add(...opening);
  for (const node of opening) node.track('opacity').step(0, 1);
  const first = c.beats[0];
  s.play(
    seq(
      ...fields.map((field, i) => {
        const duration =
          i === 0 ? first.start + first.words[0].end : first.words[i].end - first.words[i - 1].end;
        return par(x.to(field.cx, { duration, ease: linear }), width.to(field.width, { duration }));
      }),
    ),
  );
  c.hide('no-terms', cursor);
  c.show('no-terms', missing, { after: true });
  c.on('user-term', () => s.play(...terms.slice(2).map((term) => recolor(term, 'pink'))));
  c.on('rule-term', () => s.play(recolor(keys, 'pink')));
  c.swap('enter-code', [words, missing], typed);
  c.on('enter-code', () => s.play(recolor(keys, 'ink')));
  c.swap('enter-code', ask, heading('Find the same rule by its code'));
  c.show('code-hit', [underCode, match], { after: true });
}
